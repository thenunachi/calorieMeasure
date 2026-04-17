import os
import base64
import json
from flask import Flask, request, jsonify, make_response
from groq import Groq
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

app = Flask(__name__)

def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

app.after_request(add_cors_headers)

@app.route("/analyze", methods=["OPTIONS"])
@app.route("/health", methods=["OPTIONS"])
def handle_options():
    return make_response("", 204)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_image(image_file):
    """Convert uploaded image to base64 string for Groq API."""
    image = Image.open(image_file)
    # Convert to RGB if needed (e.g. PNG with alpha channel)
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")

CALORIE_PROMPT = """You are a nutrition expert. Analyze this food image and estimate calories and macronutrients.

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {"name": "food item name", "quantity": "estimated quantity", "calories": 000, "protein": "00g", "carbs": "00g", "fat": "00g"}
  ],
  "total_calories": 000,
  "total_protein": "00g",
  "total_carbs": "00g",
  "total_fat": "00g",
  "notes": "any relevant notes about the estimation"
}

Be as accurate as possible. If you cannot identify food, return items as an empty array and set all totals to 0."""

@app.route("/analyze", methods=["POST"])
def analyze_image():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Use JPG, PNG, or WEBP"}), 400

    try:
        base64_image = encode_image(file)

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                        {
                            "type": "text",
                            "text": CALORIE_PROMPT
                        }
                    ],
                }
            ],
            temperature=0.2,
            max_tokens=1024,
        )

        raw_content = response.choices[0].message.content.strip()

        # Extract JSON from the response
        if "```json" in raw_content:
            raw_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            raw_content = raw_content.split("```")[1].split("```")[0].strip()

        result = json.loads(raw_content)
        return jsonify(result), 200

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response", "raw": raw_content}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

SEARCH_PROMPT = """You are a nutrition expert. The user wants nutrition info for: "{food_name}".

Respond ONLY with valid JSON in this exact format:
{{
  "food": "proper food name",
  "serving_size": "standard serving size",
  "calories": 000,
  "macros": {{
    "protein": "00g",
    "carbohydrates": "00g",
    "fat": "00g",
    "fiber": "00g"
  }},
  "vitamins": ["Vitamin A", "Vitamin C"],
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "notes": "any relevant health notes"
}}

Be accurate. If the food is unknown, set calories to 0 and explain in notes."""

@app.route("/search", methods=["POST"])
def search_food():
    data = request.get_json()
    food_name = data.get("food", "").strip() if data else ""

    if not food_name:
        return jsonify({"error": "No food name provided"}), 400

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": SEARCH_PROMPT.format(food_name=food_name)
                }
            ],
            temperature=0.2,
            max_tokens=1024,
        )

        raw_content = response.choices[0].message.content.strip()

        if "```json" in raw_content:
            raw_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            raw_content = raw_content.split("```")[1].split("```")[0].strip()

        result = json.loads(raw_content)
        return jsonify(result), 200

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/search", methods=["OPTIONS"])
def search_options():
    return make_response("", 204)

RECIPE_PROMPT = """You are a nutrition expert. Analyze these recipe ingredients and estimate nutrition.

Ingredients:
{ingredients}

Respond ONLY with valid JSON in this exact format:
{{
  "recipe_name": "estimated dish name",
  "servings": 2,
  "per_serving": {{
    "calories": 000,
    "protein": "00g",
    "carbohydrates": "00g",
    "fat": "00g",
    "fiber": "00g"
  }},
  "total": {{
    "calories": 000,
    "protein": "00g",
    "carbohydrates": "00g",
    "fat": "00g"
  }},
  "items": [
    {{"ingredient": "name", "amount": "quantity", "calories": 000}}
  ],
  "notes": "any relevant notes"
}}"""

@app.route("/recipe", methods=["POST"])
def analyze_recipe():
    data = request.get_json()
    ingredients = data.get("ingredients", "").strip() if data else ""

    if not ingredients:
        return jsonify({"error": "No ingredients provided"}), 400

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": RECIPE_PROMPT.format(ingredients=ingredients)}],
            temperature=0.2,
            max_tokens=1024,
        )

        raw_content = response.choices[0].message.content.strip()
        if "```json" in raw_content:
            raw_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            raw_content = raw_content.split("```")[1].split("```")[0].strip()

        result = json.loads(raw_content)
        return jsonify(result), 200

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/recipe", methods=["OPTIONS"])
def recipe_options():
    return make_response("", 204)

SUBSTITUTE_PROMPT = """You are a creative nutritionist. The user has these ingredients: {ingredients}.
Their calorie limit is {max_calories} kcal per serving.

Suggest 3 different meal ideas using mainly these ingredients.

Respond ONLY with valid JSON in this exact format:
{{
  "meals": [
    {{
      "name": "Meal Name",
      "description": "One sentence description",
      "calories_per_serving": 000,
      "servings": 2,
      "ingredients_used": ["ingredient 1", "ingredient 2"],
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "macros": {{"protein": "00g", "carbs": "00g", "fat": "00g"}},
      "prep_time": "15 mins"
    }}
  ]
}}"""

@app.route("/substitute", methods=["POST"])
def substitute_finder():
    data = request.get_json()
    ingredients = data.get("ingredients", "").strip() if data else ""
    max_calories = data.get("max_calories", 600) if data else 600

    if not ingredients:
        return jsonify({"error": "No ingredients provided"}), 400

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": SUBSTITUTE_PROMPT.format(
                ingredients=ingredients, max_calories=max_calories
            )}],
            temperature=0.4,
            max_tokens=1500,
        )
        raw_content = response.choices[0].message.content.strip()
        if "```json" in raw_content:
            raw_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            raw_content = raw_content.split("```")[1].split("```")[0].strip()
        result = json.loads(raw_content)
        return jsonify(result), 200
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/substitute", methods=["OPTIONS"])
def substitute_options():
    return make_response("", 204)

SUGGEST_PROMPT = """You are a helpful nutrition coach. A user has {remaining_calories} kcal remaining today.
They have already eaten: {eaten_today}.
Their macro targets remaining: protein {remaining_protein}g, carbs {remaining_carbs}g, fat {remaining_fat}g.
Dietary preferences: {preferences}.

Suggest 4 specific meal or snack ideas that fit within their remaining calories.

Respond ONLY with valid JSON:
{{
  "suggestions": [
    {{
      "name": "Meal name",
      "description": "Short description",
      "calories": 000,
      "protein": "00g",
      "carbs": "00g",
      "fat": "00g",
      "why": "One sentence why this fits their goals"
    }}
  ]
}}"""

@app.route("/suggest", methods=["POST"])
def suggest_meals():
    data = request.get_json()
    remaining_calories  = data.get("remaining_calories", 500)
    eaten_today         = data.get("eaten_today", "nothing yet")
    remaining_protein   = data.get("remaining_protein", 50)
    remaining_carbs     = data.get("remaining_carbs", 60)
    remaining_fat       = data.get("remaining_fat", 20)
    preferences         = data.get("preferences", "none")

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": SUGGEST_PROMPT.format(
                remaining_calories=remaining_calories,
                eaten_today=eaten_today,
                remaining_protein=remaining_protein,
                remaining_carbs=remaining_carbs,
                remaining_fat=remaining_fat,
                preferences=preferences,
            )}],
            temperature=0.5,
            max_tokens=1200,
        )
        raw_content = response.choices[0].message.content.strip()
        if "```json" in raw_content:
            raw_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            raw_content = raw_content.split("```")[1].split("```")[0].strip()
        result = json.loads(raw_content)
        return jsonify(result), 200
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/suggest", methods=["OPTIONS"])
def suggest_options():
    return make_response("", 204)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=8080)
