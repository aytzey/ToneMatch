#!/usr/bin/env python3
"""Generate ToneMatch app images using Gemini API."""

import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error

API_KEY = "AIzaSyDT8critBTsHVgwSimvaOB7Z6rHznqYyeY"
MODEL = "gemini-2.0-flash-exp-image-generation"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "mobile", "assets", "images")

os.makedirs(OUT_DIR, exist_ok=True)

IMAGES = [
    # Home
    ("home_hero", "A stunning warm-toned fashion editorial portrait photograph of a woman with golden copper jewelry and autumn earth-tone clothing. Soft golden hour lighting, bokeh background in warm browns and ambers. Professional magazine quality, 4:5 aspect ratio."),
    ("home_occasion_office", "Flat lay photograph of a smart casual office outfit: camel wool blazer, cream silk blouse, dark olive trousers, leather bag, gold accessories. Clean white marble background, overhead shot, luxury fashion styling. Square format."),
    ("home_occasion_date", "Elegant date night outfit flat lay: burgundy silk dress, gold strappy heels, statement earrings, small clutch bag. Dark moody background with soft warm lighting. Luxury fashion photography. Square format."),
    ("home_occasion_weekend", "Casual weekend outfit flat lay: soft caramel cashmere sweater, dark denim, white sneakers, leather tote, sunglasses. Light wood background, warm natural light. Lifestyle fashion photography. Square format."),

    # Discover
    ("discover_hero", "Editorial fashion photograph: a model wearing a copper-toned metallic top and earth-tone skirt, dramatic warm lighting, editorial pose. Rich autumn color palette background with amber and sienna tones. Professional fashion magazine quality. 4:5 portrait orientation."),
    ("discover_office", "Smart casual office outfit: tailored olive blazer over cream top with tan leather accessories. Styled on clean background. Fashion flat lay, overhead angle. Square format."),
    ("discover_datenight", "Romantic date night styling: deep burgundy velvet top, gold pendant necklace, warm-tone makeup palette. Moody warm lighting. Fashion editorial close-up. Square format."),
    ("discover_smartcasual", "Modern smart casual everyday wear: warm camel coat, white tee, dark jeans, tan boots. Street style fashion photography with blurred city background. Clean editorial style. Square format."),
    ("discover_product1", "Luxury wool blend overcoat in deep rust/terracotta color on a wooden hanger. Clean studio photography, soft shadow, minimal background. Product photography for fashion e-commerce. 3:4 portrait."),
    ("discover_product2", "Premium silk essential shirt in forest green on a wooden hanger. Clean studio photography, soft shadow, cream background. Product photography for fashion e-commerce. 3:4 portrait."),

    # Gift Guide
    ("gift_hero", "Luxury gift boxes wrapped in gold and copper ribbon with autumn botanicals, dried flowers, and warm-toned tissue paper. Overhead flat lay on dark marble. Elegant gifting photography. 16:9 wide."),
    ("gift_silk_gold", "Luxury gift set flat lay: gold silk scarf, amber perfume bottle, copper jewelry box with bracelet, dried eucalyptus. Warm cream background, soft golden light. Premium product photography."),
    ("gift_cashmere_silver", "Luxury gift set flat lay: silver cashmere wrap, cool-toned candle, silver jewelry, lavender sprigs. Cool grey marble background, soft diffused light. Premium product photography."),

    # Occasion Guide
    ("occasion_office_hero", "Professional woman in a tailored camel blazer and cream silk blouse, confident pose in modern office. Warm natural light from large windows. Editorial portrait photography."),
    ("occasion_office_product1", "Structured leather handbag in warm cognac color. Clean product photography on light background. Minimalist luxury style."),
    ("occasion_office_product2", "Gold minimal watch on cream display stand. Clean product photography, soft shadow. Luxury accessories."),
    ("occasion_date_hero", "Woman in elegant burgundy slip dress with gold accessories, warm ambient candlelight setting. Romantic editorial fashion photography."),
    ("occasion_date_product1", "Strappy gold heels on dark velvet surface. Luxury shoe photography with warm accent lighting."),
    ("occasion_date_product2", "Statement gold drop earrings on dark background. Fine jewelry product photography, sparkle detail."),
    ("occasion_weekend_hero", "Woman in cozy camel cashmere sweater and jeans, walking in autumn park. Golden hour natural light, warm bokeh. Lifestyle fashion photography."),
    ("occasion_weekend_product1", "Premium white leather sneakers on wooden surface. Clean product photography. Minimalist lifestyle."),
    ("occasion_weekend_product2", "Oversized tote bag in soft tan leather. Product photography on light background. Lifestyle accessory."),

    # Wardrobe items
    ("wardrobe_blazer", "Terracotta linen blazer hanging on wooden hanger. Clean studio product photography, neutral background."),
    ("wardrobe_blouse", "Olive green silk blouse draped elegantly. Studio product photography, soft lighting."),
    ("wardrobe_knit", "Warm caramel cable-knit sweater folded neatly. Cozy product photography, soft natural light."),
    ("wardrobe_skirt", "Deep mahogany midi skirt on hanger. Studio product photography, clean background."),

    # Portraits (for analysis/share screens)
    ("portrait_warm", "Beautiful digital illustration of a woman with warm olive skin, dark wavy hair, hazel eyes. Warm copper/sienna background. Clean vector art style portrait. Minimal artistic illustration."),
    ("portrait_cool", "Same woman illustration but wearing a cool blue top, slightly washed out look. Cool blue-toned background. Digital art portrait showing 'wrong colors' effect."),

    # Scan / Profile
    ("scan_selfie", "Close-up selfie of a smiling woman with warm skin tone, natural makeup, natural daylight from window. No filters, clear skin texture visible. Photo quality selfie."),
    ("profile_avatar", "Stylized digital avatar illustration of a woman with warm skin tone, dark hair, minimal geometric art style. Copper/warm brown background circle. App avatar style."),

    # Paywall
    ("paywall_hero", "Artistic color palette fanning out with warm autumn tones - copper, rust, olive, cream, burgundy. Elegant gradient background. Abstract art style for premium feature showcase."),

    # Analysis Loading
    ("analysis_blur", "Soft blurred portrait with warm color overlay. Abstract bokeh effect in golden amber tones. Dreamy atmospheric photography."),
]

def generate_image(name, prompt):
    out_path = os.path.join(OUT_DIR, f"{name}.png")
    if os.path.exists(out_path):
        print(f"  SKIP {name} (already exists)")
        return True

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        },
    }).encode("utf-8")

    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        # Extract image from response
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "inlineData" in part:
                    img_data = base64.b64decode(part["inlineData"]["data"])
                    with open(out_path, "wb") as f:
                        f.write(img_data)
                    size_kb = len(img_data) / 1024
                    print(f"  OK   {name} ({size_kb:.0f} KB)")
                    return True

        print(f"  WARN {name} - no image in response")
        return False

    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"  ERR  {name} - HTTP {e.code}: {err_body}")
        return False
    except Exception as e:
        print(f"  ERR  {name} - {e}")
        return False


if __name__ == "__main__":
    print(f"Generating {len(IMAGES)} images to {OUT_DIR}\n")
    ok = 0
    fail = 0
    for i, (name, prompt) in enumerate(IMAGES):
        print(f"[{i+1}/{len(IMAGES)}] {name}")
        if generate_image(name, prompt):
            ok += 1
        else:
            fail += 1
        time.sleep(1.5)  # rate limit

    print(f"\nDone: {ok} ok, {fail} failed")
