import os
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

client = None
try:
    from google import genai
    api_key = "AQ.Ab8RN6JYGwa20pfVZlamJlqALpCX7SrnniyhmY55Qo3jTG8Uxw"
    client = genai.Client(api_key=api_key)
    print("✅ Gemini API Client initialized!")
except Exception as e:
    print("Warning: Failed to load Google GenAI SDK:", e)

@app.route('/api/analyze-route', methods=['POST'])
def analyze_route():
    data = request.get_json(silent=True) or {}
    origin = data.get('origin', 'Connaught Place')
    destination = data.get('destination', 'Mandi House')
    time_of_day = data.get('time_of_day', 'Daytime (6 AM - 5 PM)')

    prompt = f"""
    You are an urban safety risk model for 'Safe Steps' in India.
    Analyze the commuting route from '{origin}' to '{destination}' during '{time_of_day}'.

    EVALUATION MATRIX FOR DELHI/NCR:
    - Well-lit, high pedestrian density, central, or daytime routes (e.g. Connaught Place, Mandi House daytime):
      Score: 80 - 95 | zone_color: "green"
    - Mixed residential/commercial areas, evening transitions, moderate lighting:
      Score: 50 - 74 | zone_color: "yellow"
    - Isolated stretches, poor street lighting, high-risk areas at night (e.g. Bawana, industrial zones late night):
      Score: 20 - 49 | zone_color: "red"

    Return ONLY a raw JSON object with these exact keys:
    {{
      "safety_score": <number 1-100>,
      "zone_color": "<green | yellow | red>",
      "safety_summary": "<detailed analysis text>",
      "key_warnings": ["<warning 1>", "<warning 2>"]
    }}
    Do NOT include markdown block formatting or triple backticks.
    """

    if not client:
        return jsonify({
            "safety_score": 85,
            "zone_color": "green",
            "safety_summary": f"Standard route analysis for {origin} to {destination}.",
            "key_warnings": ["Stay aware of your surroundings."]
        }), 200

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'temperature': 0.7
            }
        )
        
        raw_text = response.text or ""
        clean_text = re.sub(r'```json\s*|\s*```', '', raw_text).strip()
        json_data = json.loads(clean_text)
        
        print("✅ Gemini Generated:", json_data)
        return jsonify(json_data), 200

    except Exception as err:
        print("❌ Gemini Execution Error:", err)
        # Dynamic deterministic fallback based on time of day if API quota is hit
        is_night = "Night" in time_of_day
        return jsonify({
            "safety_score": 42 if is_night else 88,
            "zone_color": "red" if is_night else "green",
            "safety_summary": f"Commute analysis for {origin} to {destination} during {time_of_day}.",
            "key_warnings": ["Exercise standard precautions", "Prefer well-lit streets"]
        }), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)