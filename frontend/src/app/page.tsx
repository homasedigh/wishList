"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, Bookmark, Check, ExternalLink, Gift, Heart, Link2, LogOut, Pencil, Plus, Search, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { API_URL, request, type Wishlist, type User } from "@/lib/api";

type Session = { token: string; user: User };
const sampleImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85"
];

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [lists, setLists] = useState<Wishlist[]>([]);
  const [activeList, setActiveList] = useState<number | null>(null);
  const [sharedIds, setSharedIds] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [newList, setNewList] = useState({ title: "", description: "", giftList: false, visibility: "PRIVATE" as Wishlist["visibility"] });
  const [newItem, setNewItem] = useState({ url: "", title: "", imageUrl: "", price: "", note: "" });

  const selected = lists.find(list => list.id === activeList) || lists[0] || null;
  const visibleItems = useMemo(() => (selected?.items || []).filter(item => item.title.toLowerCase().includes(search.toLowerCase())), [selected, search]);

  useEffect(() => {
    const raw = window.localStorage.getItem("wishful-session");
    if (raw) { try { const value = JSON.parse(raw) as Session; setSession(value); void loadLists(value.token); } catch { window.localStorage.removeItem("wishful-session"); } }
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("share");
    if (shared) void loadShared(shared);
  }, []);

  async function loadLists(token: string) {
    try { const data = await request<Wishlist[]>("/wishlists", {}, token); setLists(current => [...data, ...current.filter(list => sharedIds.includes(list.id) && !data.some(owned => owned.id === list.id))]); setSharedIds(current => current.filter(id => !data.some(list => list.id === id))); setActiveList(current => current ?? data[0]?.id ?? null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load your lists."); }
  }
  async function loadShared(token: string) {
    try { const list = await request<Wishlist>(`/public/wishlists/${encodeURIComponent(token)}`); setLists(current => [list, ...current.filter(item => item.id !== list.id)]); setSharedIds(current => current.includes(list.id) ? current : [...current, list.id]); setActiveList(list.id); }
    catch (e) { setError(e instanceof Error ? e.message : "This shared list is unavailable."); }
  }
  async function authenticate(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const result = await request<Session>(path, { method: "POST", body: JSON.stringify(auth) });
      window.localStorage.setItem("wishful-session", JSON.stringify(result)); setSession(result); setAuthOpen(false); setAuth({ name: "", email: "", password: "" }); await loadLists(result.token);
      setNotice(authMode === "register" ? "Your account is ready. Let’s make a list." : "Welcome back.");
    } catch (e) { setError(e instanceof Error ? e.message : "Authentication failed."); } finally { setBusy(false); }
  }
  async function createList(event: React.FormEvent) {
    event.preventDefault(); if (!session) return setAuthOpen(true); setBusy(true); setError("");
    try {
      const list = editingList
        ? await request<Wishlist>(`/wishlists/${editingList}`, { method: "PUT", body: JSON.stringify(newList) }, session.token)
        : await request<Wishlist>("/wishlists", { method: "POST", body: JSON.stringify(newList) }, session.token);
      setLists(current => editingList ? current.map(existing => existing.id === list.id ? list : existing) : [list, ...current]);
      setActiveList(list.id); setCreateOpen(false); setEditingList(null); setNewList({ title: "", description: "", giftList: false, visibility: "PRIVATE" }); setNotice(editingList ? "Collection updated." : "List created.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save list."); } finally { setBusy(false); }
  }
  function startNewList() {
    setEditingList(null); setNewList({ title: "", description: "", giftList: false, visibility: "PRIVATE" }); setCreateOpen(true);
  }
  function editList(list: Wishlist) {
    setEditingList(list.id); setNewList({ title: list.title, description: list.description || "", giftList: list.giftList, visibility: list.visibility }); setCreateOpen(true);
  }
  async function addItem(event: React.FormEvent) {
    event.preventDefault(); if (!session || !selected) return; setBusy(true); setError("");
    try {
      const body = JSON.stringify({ ...newItem, price: newItem.price ? Number(newItem.price) : null });
      const item = editingItem
        ? await request<Wishlist["items"][number]>(`/wishlists/${selected.id}/items/${editingItem}`, { method: "PUT", body }, session.token)
        : await request<Wishlist["items"][number]>(`/wishlists/${selected.id}/items`, { method: "POST", body }, session.token);
      setLists(current => current.map(list => list.id === selected.id ? { ...list, items: editingItem ? list.items.map(existing => existing.id === item.id ? item : existing) : [item, ...list.items] } : list));
      setAddOpen(false); setEditingItem(null); setNewItem({ url: "", title: "", imageUrl: "", price: "", note: "" }); setNotice(editingItem ? "Wishlist item updated." : "Saved to your wishlist.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this item."); } finally { setBusy(false); }
  }
  function editItem(item: Wishlist["items"][number]) {
    setEditingItem(item.id); setNewItem({ url: item.productUrl, title: item.title, imageUrl: item.imageUrl || "", price: item.price == null ? "" : String(item.price), note: item.note || "" }); setAddOpen(true);
  }
  async function deleteItem(itemId: number) {
    if (!session || !selected) return;
    try { await request<void>(`/wishlists/${selected.id}/items/${itemId}`, { method: "DELETE" }, session.token); setLists(current => current.map(list => list.id === selected.id ? { ...list, items: list.items.filter(item => item.id !== itemId) } : list)); setNotice("Item removed."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not remove item."); }
  }
  async function deleteList(listId: number) {
    if (!session || !window.confirm("Delete this wishlist and all its items? This cannot be undone.")) return;
    try { await request<void>(`/wishlists/${listId}`, { method: "DELETE" }, session.token); const next = lists.filter(list => list.id !== listId); setLists(next); setActiveList(next[0]?.id ?? null); setNotice("Wishlist deleted."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete list."); }
  }
  async function shareList() {
    if (!selected) return;
    const url = `${window.location.origin}/?share=${selected.shareToken}`;
    try { await navigator.clipboard.writeText(url); setNotice("Share link copied to clipboard."); }
    catch { window.prompt("Copy this wishlist link", url); }
  }
  async function reserveItem(itemId: number) {
    if (!selected) return;
    try {
      const updated = await request<Wishlist["items"][number]>(`/public/wishlists/${encodeURIComponent(selected.shareToken)}/items/${itemId}/reserve`, { method: "POST" });
      setLists(current => current.map(list => list.id === selected.id ? { ...list, items: list.items.map(item => item.id === itemId ? updated : item) } : list)); setNotice("Gift marked as reserved. Thanks for making their day!");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reserve this gift."); }
  }
  function signOut() { window.localStorage.removeItem("wishful-session"); setSession(null); setLists([]); setActiveList(null); setNotice("You’ve signed out."); }
  const isOwner = Boolean(session && selected && !sharedIds.includes(selected.id));

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="wishful home"><span className="brand-mark"><Heart size={17} fill="currentColor" /></span> wishful<span className="brand-period">.</span></a>
        <nav className="nav-links" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#discover">Discover</a></nav>
        <div className="top-actions">
          {session ? <><span className="user-chip">{session.user.name}</span><button className="icon-button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={18}/></button></> : <><button className="button button-quiet" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Log in</button><button className="button button-dark" onClick={() => { setAuthMode("register"); setAuthOpen(true); }}>Get started <ArrowRight size={15}/></button></>}
        </div>
      </header>

      {error && <div className="toast toast-error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
      {notice && <div className="toast" role="status"><Check size={16}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={16}/></button></div>}

      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> A LITTLE SPACE FOR BIG WISHES</div><h1>Good things<br/>are worth <em>keeping.</em></h1><p>That jacket you love. The lamp you can’t stop thinking about. All the little things that make you, <em>you.</em> Keep them somewhere lovely.</p><div className="hero-actions"><button className="button button-dark button-large" onClick={() => { if (session) setCreateOpen(true); else { setAuthMode("register"); setAuthOpen(true); } }}>Create your wishlist <ArrowRight size={17}/></button><a className="text-link" href="#how-it-works">See how it works <ArrowDownRight size={16}/></a></div><div className="social-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>S</span></div><span>A calmer way to collect the things you love.</span></div></div>
        <div className="hero-art" aria-label="A curated collection of favourite things"><div className="art-note note-top"><Heart size={15} fill="currentColor"/> little things, big feelings</div><div className="hero-photo photo-one"><img src={sampleImages[2]} alt="A thoughtfully styled outfit" /></div><div className="hero-photo photo-two"><img src={sampleImages[0]} alt="Classic red trainers" /></div><div className="hero-photo photo-three"><img src={sampleImages[1]} alt="Minimal wristwatch" /></div><div className="art-note note-bottom"><span className="note-sparkle">✳</span> saved for a someday</div><span className="scribble">♡</span></div>
      </section>

      <section className="benefit-strip" id="how-it-works"><div><span className="benefit-icon"><Bookmark size={18}/></span><b>Save from anywhere</b><span>One home for every find.</span></div><div><span className="benefit-icon"><Heart size={18}/></span><b>Make it yours</b><span>Lists for every little dream.</span></div><div><span className="benefit-icon"><Gift size={18}/></span><b>Share the good stuff</b><span>Make gifting feel personal.</span></div></section>

      <section className="workspace" id="discover">
        <div className="section-heading"><div><div className="eyebrow">YOUR CORNER OF THE INTERNET</div><h2>{session ? `Hello, ${session.user.name.split(" ")[0]}.` : "Your things, all together."}</h2><p>{session ? "Every little thing you’ve been meaning to save." : "Create a free account to save, sort and share your favourite finds."}</p></div>{session && <button className="button button-dark" onClick={startNewList}><Plus size={17}/> New list</button>}</div>
        {!session && !selected ? <div className="signed-out-card"><div className="signed-out-illustration"><Heart size={28}/><Sparkles size={17}/></div><h3>Your next favourite collection starts here.</h3><p>Sign up to create lists, save products from any store, and share your picks with friends.</p><button className="button button-dark" onClick={() => { setAuthMode("register"); setAuthOpen(true); }}>Make your first list <ArrowRight size={16}/></button></div> : lists.length === 0 ? <div className="empty-state"><div className="empty-icon"><Bookmark size={24}/></div><h3>A blank page, full of possibility.</h3><p>Create your first list, then add products by pasting a link from any shop.</p><button className="button button-dark" onClick={() => setCreateOpen(true)}><Plus size={16}/> Create a list</button></div> : <div className="collection-layout"><aside className="collection-sidebar"><div className="sidebar-label">YOUR COLLECTIONS <span>{lists.length}</span></div>{lists.map(list => <button key={list.id} className={selected?.id === list.id ? "collection-tab selected" : "collection-tab"} onClick={() => { setActiveList(list.id); setSearch(""); }}><span className="collection-dot">{list.giftList ? <Gift size={15}/> : <Heart size={15}/>}</span><span className="collection-name">{list.title}</span><span className="collection-count">{list.items.length}</span></button>)}<button className="add-collection" onClick={() => setCreateOpen(true)}><Plus size={15}/> New collection</button></aside><div className="collection-main">{selected && <><div className="collection-title-row"><div><div className="collection-kicker">{selected.giftList ? "A LITTLE SOMETHING FOR SOMEONE" : "COLLECTION"}</div><h3>{selected.title}</h3><p>{selected.description || "All the things you have your eye on."}</p></div><div className="collection-actions">{isOwner && <button className="button button-outline" onClick={() => editList(selected)}><Pencil size={14}/> Edit</button>}<button className="button button-outline" onClick={shareList}><Link2 size={15}/> Share</button>{isOwner && <button className="icon-button" aria-label="Delete wishlist" title="Delete wishlist" onClick={() => void deleteList(selected.id)}><Trash2 size={17}/></button>}</div></div><div className="collection-tools"><label className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find something in this list..." aria-label="Search items"/></label><span>{selected.items.length} {selected.items.length === 1 ? "little thing" : "little things"}</span>{isOwner && <button className="button button-dark button-small" onClick={() => { setEditingItem(null); setNewItem({ url: "", title: "", imageUrl: "", price: "", note: "" }); setAddOpen(true); }}><Plus size={15}/> Add item</button>}</div>{visibleItems.length === 0 ? <div className="empty-items"><div className="empty-icon"><Sparkles size={22}/></div><h4>{search ? "Nothing by that name (yet)." : "This list is waiting for its first find."}</h4><p>{search ? "Try another search." : "Paste a product link to keep it close."}</p>{!search && <button className="button button-outline" onClick={() => setAddOpen(true)}><Plus size={15}/> Add your first item</button>}</div> : <div className="product-grid">{visibleItems.map((item, index) => <article className="product-card" key={item.id}><div className="product-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }}/> : <img src={sampleImages[index % sampleImages.length]} alt="" loading="lazy"/>}<span className="product-badge">{item.reserved ? "Reserved" : selected.giftList ? "Gift idea" : "Saved for later"}</span>{isOwner && <button className="remove-product" aria-label={`Remove ${item.title}`} title="Remove item" onClick={() => void deleteItem(item.id)}><Trash2 size={15}/></button>}</div><div className="product-info"><h4>{item.title}</h4><div className="product-bottom"><span className="product-price">{item.price != null ? new Intl.NumberFormat("en-GB", { style: "currency", currency: item.currency || "GBP" }).format(item.price) : "A little something"}</span><div className="product-links">{isOwner && <button title="Edit item" aria-label={`Edit ${item.title}`} onClick={() => editItem(item)}><Pencil size={15}/></button>}<a href={item.productUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.title} at retailer`}><ExternalLink size={15}/></a>{selected.giftList && !item.reserved && <button title="Reserve this gift" aria-label="Reserve this gift" onClick={() => void reserveItem(item.id)}><Gift size={15}/></button>}</div></div>{item.note && <p className="product-note">{item.note}</p>}</div></article>)}</div>}</>}</div></div>}
      </section>

      <section className="closing"><div className="closing-flower">✳</div><div className="eyebrow">A SMALL REMINDER</div><h2>You’re allowed to want<br/><em>lovely things.</em></h2><p>Keep a little record of what makes you smile. The rest can wait.</p><button className="button button-dark button-large" onClick={() => { if (session) setCreateOpen(true); else { setAuthMode("register"); setAuthOpen(true); } }}>Start collecting <ArrowRight size={16}/></button></section>
      <footer className="footer"><a className="brand" href="/"><span className="brand-mark"><Heart size={15} fill="currentColor"/></span> wishful<span className="brand-period">.</span></a><span>Made for the things you love.</span><div><a href="#how-it-works">How it works</a><a href={`${API_URL.replace("/api", "")}/swagger-ui/index.html`} target="_blank" rel="noreferrer">API docs <ExternalLink size={12}/></a></div></footer>

      {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setAuthOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close"><X size={19}/></button><div className="modal-icon"><Heart size={22}/></div><div className="eyebrow">{authMode === "register" ? "YOUR OWN LITTLE CORNER" : "GOOD TO HAVE YOU BACK"}</div><h2 id="auth-title">{authMode === "register" ? "Let’s make a little space." : "Welcome back."}</h2><p>{authMode === "register" ? "A free account for all the things you love." : "Your favourite things are right where you left them."}</p><form onSubmit={authenticate}>{authMode === "register" && <label>Your name<input required minLength={2} value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="e.g. Alex Morgan"/></label>}<label>Email address<input required type="email" autoComplete="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com"/></label><label>Password<input required type="password" minLength={8} autoComplete={authMode === "register" ? "new-password" : "current-password"} value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 8 characters"/></label><button className="button button-dark button-full" disabled={busy}>{busy ? "One moment..." : authMode === "register" ? "Create my account" : "Log in"} <ArrowRight size={16}/></button></form><div className="modal-switch">{authMode === "register" ? "Already have an account?" : "New around here?"} <button onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setError(""); }}> {authMode === "register" ? "Log in" : "Create an account"}</button></div><div className="secure-note"><ShieldCheck size={14}/> Your account, your things. Always.</div></section></div>}

      {createOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setCreateOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><button className="modal-close" onClick={() => { setCreateOpen(false); setEditingList(null); }} aria-label="Close"><X size={19}/></button><div className="modal-icon"><Bookmark size={22}/></div><div className="eyebrow">{editingList ? "MAKE A FEW CHANGES" : "A NEW COLLECTION"}</div><h2 id="create-title">{editingList ? "Let’s tidy this collection." : "What are we dreaming of?"}</h2><p>{editingList ? "Update the details for this collection." : "Give this little collection a name."}</p><form onSubmit={createList}><label>Collection name<input required minLength={2} maxLength={100} value={newList.title} onChange={e => setNewList({ ...newList, title: e.target.value })} placeholder="Birthday ideas, home things..."/></label><label>A little description <span className="optional">(optional)</span><textarea maxLength={500} value={newList.description} onChange={e => setNewList({ ...newList, description: e.target.value })} placeholder="What is this list for?"/></label><label className="check-row"><input type="checkbox" checked={newList.giftList} onChange={e => setNewList({ ...newList, giftList: e.target.checked })}/><span><b>Make it a gift list</b><small>Let friends reserve gifts to avoid duplicates.</small></span><Gift size={18}/></label><label>Who can see it<select value={newList.visibility} onChange={e => setNewList({ ...newList, visibility: e.target.value as Wishlist["visibility"] })}><option value="PRIVATE">Just me (private)</option><option value="LINK">Anyone with the link</option><option value="PUBLIC">Public</option></select></label><button className="button button-dark button-full" disabled={busy}>{busy ? "Saving..." : editingList ? "Save changes" : "Create collection"} <ArrowRight size={16}/></button></form></section></div>}

      {addOpen && selected && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setAddOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title"><button className="modal-close" onClick={() => { setAddOpen(false); setEditingItem(null); }} aria-label="Close"><X size={19}/></button><div className="modal-icon"><Plus size={22}/></div><div className="eyebrow">{editingItem ? "MAKE IT JUST RIGHT" : "SAVE SOMETHING LOVELY"}</div><h2 id="add-title">{editingItem ? "Edit this little something." : "Add a little something."}</h2><p>{editingItem ? "Update the details you want to remember." : "Paste a product link from any shop. We’ll save it here so you can find it later."}</p><form onSubmit={addItem}><label>Product link<input required type="url" value={newItem.url} onChange={e => setNewItem({ ...newItem, url: e.target.value })} placeholder="https://your-favourite-shop.com/product" /></label><label>Product image URL <span className="optional">(optional)</span><input type="url" value={newItem.imageUrl} onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })} placeholder="https://.../product-image.jpg"/></label><label>What is it called?<input required minLength={2} maxLength={180} value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} placeholder="A name you'll remember"/></label><label>Price <span className="optional">(optional, in GBP)</span><input type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} placeholder="45.00"/></label><label>A note to yourself <span className="optional">(optional)</span><textarea maxLength={1000} value={newItem.note} onChange={e => setNewItem({ ...newItem, note: e.target.value })} placeholder="The colour, the size, why you love it..."/></label><button className="button button-dark button-full" disabled={busy}>{busy ? "Saving..." : editingItem ? "Save changes" : "Save to this list"} <Bookmark size={16}/></button></form></section></div>}
    </main>
  );
}
