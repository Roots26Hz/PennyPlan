"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store,
  Package,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import type { FurnitureCategory } from "@/lib/types";

const CATEGORIES: FurnitureCategory[] = [
  "sofa", "chair", "table", "desk", "bed", "dresser",
  "bookshelf", "nightstand", "rug", "lamp", "storage", "other",
];

const STYLE_OPTIONS = [
  "modern", "minimalist", "scandinavian", "industrial",
  "bohemian", "traditional", "mid-century", "farmhouse",
];

interface DealerInfo {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
}

interface ProductEntry {
  id: string;
  name: string;
  category: string;
  price: number;
  width_in: number;
  depth_in: number;
  height_in: number;
  style_tags: string[];
  color: string;
  description: string;
}

export default function DealerPortalPage() {
  // Signup / auth state
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [signupForm, setSignupForm] = useState({
    business_name: "",
    owner_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    zip_code: "",
    website: "",
  });

  // Product state
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "table" as FurnitureCategory,
    price: "",
    width_in: "",
    depth_in: "",
    height_in: "",
    style_tags: [] as string[],
    color: "",
    description: "",
    image_url: "",
  });

  // UI state
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [productError, setProductError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Dealer signup ─────────────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError("");
    setIsSigningUp(true);

    try {
      const res = await fetch("/api/dealers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || "Signup failed");
        return;
      }

      setDealer({
        id: data.dealer.id,
        business_name: data.dealer.business_name,
        owner_name: data.dealer.owner_name,
        email: data.dealer.email,
      });

      if (data.demo) {
        setSuccessMsg("Demo mode: Dealer registered locally (Supabase not connected).");
      } else {
        setSuccessMsg("Welcome! Your dealer account has been created.");
      }
    } catch {
      setSignupError("Network error. Please try again.");
    } finally {
      setIsSigningUp(false);
    }
  }

  // ── Add product ───────────────────────────────────────────────────────
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!dealer) return;
    setProductError("");
    setIsAddingProduct(true);

    try {
      const payload = {
        dealer_id: dealer.id,
        name: productForm.name,
        category: productForm.category,
        price: parseFloat(productForm.price),
        width_in: productForm.width_in ? parseFloat(productForm.width_in) : null,
        depth_in: productForm.depth_in ? parseFloat(productForm.depth_in) : null,
        height_in: productForm.height_in ? parseFloat(productForm.height_in) : null,
        style_tags: productForm.style_tags,
        color: productForm.color,
        description: productForm.description,
        image_url: productForm.image_url,
      };

      const res = await fetch("/api/dealers/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setProductError(data.error || "Failed to add product");
        return;
      }

      setProducts((prev) => [
        {
          id: data.product.id,
          name: data.product.name,
          category: data.product.category,
          price: data.product.price,
          width_in: data.product.width_in || 0,
          depth_in: data.product.depth_in || 0,
          height_in: data.product.height_in || 0,
          style_tags: data.product.style_tags || [],
          color: data.product.color || "",
          description: data.product.description || "",
        },
        ...prev,
      ]);

      // Reset form
      setProductForm({
        name: "",
        category: "table",
        price: "",
        width_in: "",
        depth_in: "",
        height_in: "",
        style_tags: [],
        color: "",
        description: "",
        image_url: "",
      });
      setSuccessMsg("Product added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setProductError("Network error. Please try again.");
    } finally {
      setIsAddingProduct(false);
    }
  }

  function toggleStyle(style: string) {
    setProductForm((prev) => ({
      ...prev,
      style_tags: prev.style_tags.includes(style)
        ? prev.style_tags.filter((s) => s !== style)
        : [...prev.style_tags, style],
    }));
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-penny-500 text-white">
              <Store size={18} />
            </div>
            <span className="text-xl font-bold text-stone-800">
              Penny<span className="text-penny-500">Plan</span>
              <span className="ml-2 text-sm font-normal text-stone-400">
                Dealer Portal
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <ArrowLeft size={14} />
            Back to App
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Success banner */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {!dealer ? (
          // ── SIGNUP FORM ─────────────────────────────────────────────
          <div className="mx-auto max-w-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-penny-100 text-penny-500">
                <Store size={32} />
              </div>
              <h1 className="text-3xl font-bold text-stone-900">
                Join as a Local Dealer
              </h1>
              <p className="mt-2 text-stone-500">
                Sign up to list your furniture on PennyPlan. Your inventory
                appears first when customers search for pieces that fit their
                room.
              </p>
            </div>

            <form
              onSubmit={handleSignup}
              className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-stone-800">
                Business Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.business_name}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, business_name: e.target.value })
                    }
                    placeholder="e.g. Local Woodworks Co."
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Owner / Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.owner_name}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, owner_name: e.target.value })
                    }
                    placeholder="e.g. James Carter"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, email: e.target.value })
                    }
                    placeholder="you@business.com"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={signupForm.phone}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, phone: e.target.value })
                    }
                    placeholder="555-123-4567"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.city}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, city: e.target.value })
                    }
                    placeholder="Austin"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.state}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, state: e.target.value })
                    }
                    placeholder="TX"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={signupForm.zip_code}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, zip_code: e.target.value })
                    }
                    placeholder="78701"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">
                  Website
                </label>
                <input
                  type="url"
                  value={signupForm.website}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, website: e.target.value })
                  }
                  placeholder="https://yourbusiness.com"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                />
              </div>

              {signupError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {signupError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningUp}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-penny-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-penny-600 disabled:opacity-60"
              >
                {isSigningUp ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Registering…
                  </>
                ) : (
                  <>
                    <Store size={16} />
                    Sign Up as Dealer
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          // ── INVENTORY DASHBOARD ─────────────────────────────────────
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-stone-900">
                Welcome, {dealer.business_name}
              </h1>
              <p className="mt-1 text-stone-500">
                Add your furniture inventory below. Products you list will be
                shown <strong>first</strong> to PennyPlan customers.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              {/* Add product form */}
              <form
                onSubmit={handleAddProduct}
                className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-3"
              >
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-800">
                  <Plus size={18} className="text-penny-500" />
                  Add Product
                </h2>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    placeholder="e.g. Handcrafted Teak Dining Table"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-600">
                      Category *
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category: e.target.value as FurnitureCategory,
                        })
                      }
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-600">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: e.target.value })
                      }
                      placeholder="185.00"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                    />
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Dimensions (inches)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={productForm.width_in}
                      onChange={(e) =>
                        setProductForm({ ...productForm, width_in: e.target.value })
                      }
                      placeholder="Width"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={productForm.depth_in}
                      onChange={(e) =>
                        setProductForm({ ...productForm, depth_in: e.target.value })
                      }
                      placeholder="Depth"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={productForm.height_in}
                      onChange={(e) =>
                        setProductForm({ ...productForm, height_in: e.target.value })
                      }
                      placeholder="Height"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                    />
                  </div>
                </div>

                {/* Style Tags */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Style Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleStyle(style)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          productForm.style_tags.includes(style)
                            ? "bg-penny-500 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-600">
                      Color
                    </label>
                    <input
                      type="text"
                      value={productForm.color}
                      onChange={(e) =>
                        setProductForm({ ...productForm, color: e.target.value })
                      }
                      placeholder="e.g. Natural Teak"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-600">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={productForm.image_url}
                      onChange={(e) =>
                        setProductForm({ ...productForm, image_url: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    placeholder="Brief description of the product…"
                    rows={2}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-penny-400 focus:ring-2 focus:ring-penny-100"
                  />
                </div>

                {productError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {productError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAddingProduct}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-penny-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-penny-600 disabled:opacity-60"
                >
                  {isAddingProduct ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add to Inventory
                    </>
                  )}
                </button>
              </form>

              {/* Inventory list */}
              <div className="lg:col-span-2">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-800">
                  <Package size={18} className="text-penny-500" />
                  Your Inventory
                  <span className="ml-auto text-sm font-normal text-stone-400">
                    {products.length} item{products.length !== 1 ? "s" : ""}
                  </span>
                </h2>

                {products.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
                    <Package size={32} className="mx-auto mb-2 text-stone-300" />
                    <p className="text-sm text-stone-400">
                      No products added yet. Use the form to add your first item.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate text-sm font-semibold text-stone-800">
                            {p.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                            <span className="rounded bg-stone-100 px-2 py-0.5 font-medium text-stone-600">
                              {p.category}
                            </span>
                            <span className="font-semibold text-penny-600">
                              ${p.price.toFixed(2)}
                            </span>
                            {p.color && <span>• {p.color}</span>}
                            {p.width_in > 0 && (
                              <span>
                                • {p.width_in}×{p.depth_in}×{p.height_in} in
                              </span>
                            )}
                          </div>
                          {p.style_tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {p.style_tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full bg-penny-50 px-2 py-0.5 text-[10px] font-medium text-penny-600"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="mt-1 rounded p-1 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-6 text-center text-sm text-stone-400">
        PennyPlan Dealer Portal — List your furniture and reach budget-conscious
        customers.
      </footer>
    </main>
  );
}
