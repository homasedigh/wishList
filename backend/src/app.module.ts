import { Module, Injectable, OnModuleInit, OnModuleDestroy, Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, Matches } from 'class-validator';

const visibilityValues = ['PRIVATE', 'LINK', 'PUBLIC'];
type Visibility = 'PRIVATE' | 'LINK' | 'PUBLIC';
type User = { [key: string]: any; id: number; name: string; email: string; password_hash?: string };
type Item = { id: number; title: string; productUrl: string; imageUrl: string | null; price: string | null; currency: string; note: string | null; reserved: boolean; createdAt: string };
type Wishlist = { id: number; title: string; description: string | null; shareToken: string; visibility: Visibility; giftList: boolean; items: Item[]; createdAt: string };

class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
}
class LoginDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @IsNotEmpty() password!: string;
}
class WishlistDto {
  @IsString() @IsNotEmpty() @MaxLength(100) title!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() giftList?: boolean;
  @IsOptional() @IsIn(visibilityValues) visibility?: Visibility;
}
class ItemDto {
  @IsString() @IsNotEmpty() @MaxLength(180) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(2048) url!: string;
  @IsOptional() @IsString() @MaxLength(2048) imageUrl?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999.99) price?: number;
  @IsOptional() @Matches(/^[A-Za-z]{3}$/) currency?: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

@Injectable()
class DbService implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://wishful:wishful_local_only@localhost:5432/wishful', max: 10 });
  async onModuleInit(): Promise<void> {
    const statements = [
      "CREATE TABLE IF NOT EXISTS app_user (id BIGSERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE, password_hash VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)",
      "CREATE TABLE IF NOT EXISTS wishlist (id BIGSERIAL PRIMARY KEY, owner_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE, title VARCHAR(100) NOT NULL, description VARCHAR(500), share_token VARCHAR(64) NOT NULL UNIQUE, visibility VARCHAR(16) NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE','LINK','PUBLIC')), gift_list BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)",
      "CREATE INDEX IF NOT EXISTS idx_wishlist_owner ON wishlist(owner_id)",
      "CREATE TABLE IF NOT EXISTS wishlist_item (id BIGSERIAL PRIMARY KEY, wishlist_id BIGINT NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE, title VARCHAR(180) NOT NULL, product_url VARCHAR(2048) NOT NULL, image_url VARCHAR(2048), price NUMERIC(12,2), currency VARCHAR(3) NOT NULL DEFAULT 'GBP', note VARCHAR(1000), reserved BOOLEAN NOT NULL DEFAULT FALSE, reserved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)",
      "CREATE INDEX IF NOT EXISTS idx_wishlist_item_parent ON wishlist_item(wishlist_id)"
    ];
    for (const statement of statements) await this.pool.query(statement);
  }
  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
  query<T extends Record<string, any> = any>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> { return this.pool.query<T>(sql, params); }
}

@Injectable()
class AuthService {
  constructor(private readonly db: DbService) {}
  private secret(): string {
    const secret = process.env.JWT_SECRET || 'local-development-secret-key-change-me-32-bytes-minimum';
    if (secret.length < 32 && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be at least 32 characters in production.');
    return secret;
  }
  private authResponse(user: User): { token: string; user: { id: number; name: string; email: string } } {
    const expiresIn = (process.env.JWT_EXPIRATION || '12h') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign({ sub: String(user.id), email: user.email }, this.secret(), { expiresIn });
    return { token, user: { id: Number(user.id), name: user.name, email: user.email } };
  }
  async register(dto: RegisterDto): Promise<ReturnType<AuthService['authResponse']>> {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.db.query('SELECT id FROM app_user WHERE lower(email) = $1', [email]);
    if (exists.rowCount) throw new HttpException('An account with this email already exists.', HttpStatus.CONFLICT);
    try {
      const result = await this.db.query<User>('INSERT INTO app_user(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [dto.name.trim(), email, await bcrypt.hash(dto.password, 12)]);
      return this.authResponse(result.rows[0]);
    } catch (error: any) {
      if (error && error.code === '23505') throw new HttpException('An account with this email already exists.', HttpStatus.CONFLICT);
      throw error;
    }
  }
  async login(dto: LoginDto): Promise<ReturnType<AuthService['authResponse']>> {
    const result = await this.db.query<User>('SELECT id,name,email,password_hash FROM app_user WHERE lower(email) = $1', [dto.email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user || !user.password_hash || !(await bcrypt.compare(dto.password, user.password_hash))) throw new HttpException('Email or password is incorrect.', HttpStatus.UNAUTHORIZED);
    return this.authResponse(user);
  }
  async verify(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, this.secret()) as jwt.JwtPayload;
      if (!payload.sub) throw new Error('Missing subject');
      const result = await this.db.query<User>('SELECT id,name,email FROM app_user WHERE id = $1', [payload.sub]);
      if (!result.rows[0]) throw new Error('User not found');
      return result.rows[0];
    } catch {
      throw new HttpException('Invalid or expired bearer token.', HttpStatus.UNAUTHORIZED);
    }
  }
}

@Injectable()
class JwtGuard {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    if (!header || !header.startsWith('Bearer ')) throw new HttpException('Authentication required.', HttpStatus.UNAUTHORIZED);
    request.user = await this.auth.verify(header.slice(7));
    return true;
  }
}

@Injectable()
class WishlistService {
  constructor(private readonly db: DbService) {}
  private clean(value: string | undefined | null): string | null { return value == null || !value.trim() ? null : value.trim(); }
  private validateUrl(value: string | undefined | null, optional = false): string | null {
    if (optional && !value?.trim()) return null;
    try {
      const parsed = new URL(String(value).trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('scheme');
      return parsed.toString();
    } catch { throw new HttpException('Product links must be valid http or https URLs.', HttpStatus.BAD_REQUEST); }
  }
  private async owned(id: string, user: User): Promise<any> {
    const result = await this.db.query('SELECT w.* FROM wishlist w WHERE w.id = $1 AND w.owner_id = $2', [id, user.id]);
    if (!result.rows[0]) throw new HttpException('Wishlist not found.', HttpStatus.NOT_FOUND);
    return result.rows[0];
  }
  private async listItems(listId: string | number): Promise<Item[]> {
    const result = await this.db.query('SELECT id,title,product_url,image_url,price,currency,note,reserved,created_at FROM wishlist_item WHERE wishlist_id = $1 ORDER BY created_at DESC,id DESC', [listId]);
    return result.rows.map((r: any) => ({ id: Number(r.id), title: r.title, productUrl: r.product_url, imageUrl: r.image_url, price: r.price === null ? null : Number(r.price), currency: r.currency, note: r.note, reserved: r.reserved, createdAt: new Date(r.created_at).toISOString() }));
  }
  private async shape(row: any): Promise<Wishlist> {
    return { id: Number(row.id), title: row.title, description: row.description, shareToken: row.share_token, visibility: row.visibility, giftList: row.gift_list, items: await this.listItems(row.id), createdAt: new Date(row.created_at).toISOString() };
  }
  async list(user: User): Promise<Wishlist[]> {
    const result = await this.db.query('SELECT w.* FROM wishlist w WHERE w.owner_id = $1 ORDER BY w.created_at DESC', [user.id]);
    return Promise.all(result.rows.map((r: any) => this.shape(r)));
  }
  async create(user: User, dto: WishlistDto): Promise<Wishlist> {
    const result = await this.db.query('INSERT INTO wishlist(owner_id,title,description,share_token,visibility,gift_list) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [user.id, dto.title.trim(), this.clean(dto.description), require('crypto').randomBytes(24).toString('hex'), dto.visibility || 'PRIVATE', dto.giftList || false]);
    return this.shape(result.rows[0]);
  }
  async get(user: User, id: string): Promise<Wishlist> { return this.shape(await this.owned(id, user)); }
  async update(user: User, id: string, dto: WishlistDto): Promise<Wishlist> {
    await this.owned(id, user);
    const result = await this.db.query('UPDATE wishlist SET title=$1,description=$2,visibility=$3,gift_list=$4,updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *', [dto.title.trim(), this.clean(dto.description), dto.visibility || 'PRIVATE', dto.giftList || false, id]);
    return this.shape(result.rows[0]);
  }
  async remove(user: User, id: string): Promise<void> { await this.owned(id, user); await this.db.query('DELETE FROM wishlist WHERE id=$1', [id]); }
  async addItem(user: User, id: string, dto: ItemDto): Promise<Item> {
    await this.owned(id, user);
    const url = this.validateUrl(dto.url)!;
    const image = this.validateUrl(dto.imageUrl, true);
    const result = await this.db.query('INSERT INTO wishlist_item(wishlist_id,title,product_url,image_url,price,currency,note) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', [id,dto.title.trim(),url,image,dto.price ?? null,(dto.currency || 'GBP').toUpperCase(),this.clean(dto.note)]);
    return this.itemShape(result.rows[0]);
  }
  private itemShape(r: any): Item { return { id: Number(r.id), title: r.title, productUrl: r.product_url, imageUrl: r.image_url, price: r.price === null ? null : Number(r.price), currency: r.currency, note: r.note, reserved: r.reserved, createdAt: new Date(r.created_at).toISOString() }; }
  async updateItem(user: User, listId: string, itemId: string, dto: ItemDto): Promise<Item> {
    await this.owned(listId, user);
    const result = await this.db.query('UPDATE wishlist_item SET title=$1,product_url=$2,image_url=$3,price=$4,currency=$5,note=$6 WHERE id=$7 AND wishlist_id=$8 RETURNING *', [dto.title.trim(),this.validateUrl(dto.url),this.validateUrl(dto.imageUrl,true),dto.price ?? null,(dto.currency || 'GBP').toUpperCase(),this.clean(dto.note),itemId,listId]);
    if (!result.rows[0]) throw new HttpException('Wishlist item not found.', HttpStatus.NOT_FOUND);
    return this.itemShape(result.rows[0]);
  }
  async removeItem(user: User, listId: string, itemId: string): Promise<void> {
    await this.owned(listId, user);
    const result = await this.db.query('DELETE FROM wishlist_item WHERE id=$1 AND wishlist_id=$2', [itemId,listId]);
    if (!result.rowCount) throw new HttpException('Wishlist item not found.', HttpStatus.NOT_FOUND);
  }
  private async shared(token: string): Promise<any> {
    const result = await this.db.query('SELECT * FROM wishlist WHERE share_token=$1', [token]);
    const list = result.rows[0];
    if (!list || (list.visibility === 'PRIVATE' && !list.gift_list)) throw new HttpException('Shared wishlist not found.', HttpStatus.NOT_FOUND);
    return list;
  }
  async getShared(token: string): Promise<Wishlist> { return this.shape(await this.shared(token)); }
  async reserve(token: string, itemId: string): Promise<Item> {
    const list = await this.shared(token);
    if (!list.gift_list) throw new HttpException('Only gift lists support reservations.', HttpStatus.BAD_REQUEST);
    const result = await this.db.query('UPDATE wishlist_item SET reserved=TRUE,reserved_at=CURRENT_TIMESTAMP WHERE id=$1 AND wishlist_id=$2 AND reserved=FALSE RETURNING *', [itemId,list.id]);
    if (result.rows[0]) return this.itemShape(result.rows[0]);
    const existing = await this.db.query('SELECT id FROM wishlist_item WHERE id=$1 AND wishlist_id=$2', [itemId,list.id]);
    if (!existing.rowCount) throw new HttpException('Wishlist item not found.', HttpStatus.NOT_FOUND);
    throw new HttpException('This gift has already been reserved.', HttpStatus.CONFLICT);
  }
}

@Controller('auth')
class AuthController {
  constructor(private readonly auth: AuthService) {}
  @HttpCode(HttpStatus.OK) @Post('register') register(@Body() dto: RegisterDto): Promise<any> { return this.auth.register(dto); }
  @HttpCode(HttpStatus.OK) @Post('login') login(@Body() dto: LoginDto): Promise<any> { return this.auth.login(dto); }
  @UseGuards(JwtGuard) @Get('me') me(@Req() request: any): any { const u = request.user as User; return { id: Number(u.id), name: u.name, email: u.email }; }
}

@Controller()
class WishlistController {
  constructor(private readonly wishlists: WishlistService) {}
  @UseGuards(JwtGuard) @Get('wishlists') list(@Req() req: any): Promise<Wishlist[]> { return this.wishlists.list(req.user); }
  @UseGuards(JwtGuard) @Post('wishlists') create(@Req() req: any, @Body() dto: WishlistDto): Promise<Wishlist> { return this.wishlists.create(req.user, dto); }
  @UseGuards(JwtGuard) @Get('wishlists/:id') get(@Req() req: any, @Param('id') id: string): Promise<Wishlist> { return this.wishlists.get(req.user, id); }
  @UseGuards(JwtGuard) @Put('wishlists/:id') update(@Req() req: any, @Param('id') id: string, @Body() dto: WishlistDto): Promise<Wishlist> { return this.wishlists.update(req.user, id, dto); }
  @HttpCode(HttpStatus.NO_CONTENT) @UseGuards(JwtGuard) @Delete('wishlists/:id') async remove(@Req() req: any, @Param('id') id: string): Promise<void> { await this.wishlists.remove(req.user, id); }
  @UseGuards(JwtGuard) @Post('wishlists/:id/items') addItem(@Req() req: any, @Param('id') id: string, @Body() dto: ItemDto): Promise<Item> { return this.wishlists.addItem(req.user, id, dto); }
  @UseGuards(JwtGuard) @Put('wishlists/:listId/items/:itemId') updateItem(@Req() req: any, @Param('listId') listId: string, @Param('itemId') itemId: string, @Body() dto: ItemDto): Promise<Item> { return this.wishlists.updateItem(req.user, listId, itemId, dto); }
  @HttpCode(HttpStatus.NO_CONTENT) @UseGuards(JwtGuard) @Delete('wishlists/:listId/items/:itemId') async removeItem(@Req() req: any, @Param('listId') listId: string, @Param('itemId') itemId: string): Promise<void> { await this.wishlists.removeItem(req.user, listId, itemId); }
  @Get('public/wishlists/:shareToken') shared(@Param('shareToken') token: string): Promise<Wishlist> { return this.wishlists.getShared(token); }
  @HttpCode(HttpStatus.OK) @Post('public/wishlists/:shareToken/items/:itemId/reserve') reserve(@Param('shareToken') token: string, @Param('itemId') itemId: string): Promise<Item> { return this.wishlists.reserve(token, itemId); }
}

@Injectable()
class HealthControllerService {
  constructor(private readonly db: DbService) {}
  async health(): Promise<{ status: string }> { await this.db.query('SELECT 1'); return { status: 'ok' }; }
}
@Controller()
class HealthController {
  constructor(private readonly healthService: HealthControllerService) {}
  @Get('health') async health(): Promise<{ status: string }> { return this.healthService.health(); }
}

@Module({ controllers: [AuthController, WishlistController, HealthController], providers: [DbService, AuthService, JwtGuard, WishlistService, HealthControllerService] })
export class AppModule {}
