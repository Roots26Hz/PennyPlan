import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * POST /api/dealers/products — Add a product to a dealer's inventory
 * GET  /api/dealers/products?dealer_id=xxx — List a dealer's products
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealer_id,
      name,
      category,
      price,
      width_in,
      depth_in,
      height_in,
      style_tags = [],
      color = "",
      image_url = "",
      product_url = "",
      description = "",
    } = body;

    if (!dealer_id || !name || !category || price == null) {
      return NextResponse.json(
        { error: "Missing required fields: dealer_id, name, category, price" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        product: {
          id: "demo-product-" + Date.now(),
          dealer_id,
          name,
          category,
          price,
          width_in,
          depth_in,
          height_in,
          style_tags,
          color,
          in_stock: true,
          image_url,
          product_url,
          description,
          created_at: new Date().toISOString(),
        },
        demo: true,
        message: "Demo mode — Supabase not configured. Product saved locally.",
      });
    }

    const { data, error } = await supabase
      .from("local_products")
      .insert({
        dealer_id,
        name,
        category,
        price,
        width_in: width_in || null,
        depth_in: depth_in || null,
        height_in: height_in || null,
        style_tags,
        color,
        in_stock: true,
        image_url: image_url || null,
        product_url: product_url || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error("Add product error:", error);
    return NextResponse.json(
      { error: "Failed to add product" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id");

    if (!dealerId) {
      return NextResponse.json(
        { error: "Missing dealer_id query parameter" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        products: [],
        demo: true,
        message: "Demo mode — Supabase not configured.",
      });
    }

    const { data, error } = await supabase
      .from("local_products")
      .select("*")
      .eq("dealer_id", dealerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    console.error("List products error:", error);
    return NextResponse.json(
      { error: "Failed to list products" },
      { status: 500 }
    );
  }
}
