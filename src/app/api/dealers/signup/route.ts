import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * POST /api/dealers/signup — Register a new local dealer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, owner_name, email, phone, city, state, zip_code, website } = body;

    if (!business_name || !owner_name || !email || !city || !state) {
      return NextResponse.json(
        { error: "Missing required fields: business_name, owner_name, email, city, state" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      // Return a fake dealer ID for demo mode
      return NextResponse.json({
        dealer: {
          id: "demo-dealer-" + Date.now(),
          business_name,
          owner_name,
          email,
          city,
          state,
          created_at: new Date().toISOString(),
        },
        demo: true,
        message: "Demo mode — Supabase not configured. Dealer registered locally.",
      });
    }

    const { data, error } = await supabase
      .from("local_dealers")
      .insert({
        business_name,
        owner_name,
        email,
        phone: phone || null,
        city,
        state,
        zip_code: zip_code || null,
        website: website || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A dealer with this email already exists." },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ dealer: data });
  } catch (error) {
    console.error("Dealer signup error:", error);
    return NextResponse.json(
      { error: "Failed to register dealer" },
      { status: 500 }
    );
  }
}
