@app.route('/api/analyze-route', methods=['POST'])
def analyze_route():
    data = request.get_json(silent=True) or {}
    origin = data.get('origin', '')
    destination = data.get('destination', '')
    time_of_day = data.get('time_of_day', '')

    print("\n================ DEBUG LOG ================")
    print(f"1. Incoming Request: {origin} -> {destination} ({time_of_day})")
    print(f"2. Client Status: {'INITIALIZED' if client else 'NULL / UNINITIALIZED'}")

    fallback_response = {
        "safety_score": 72,
        "zone_color": "yellow",
        "safety_summary": f"Fallback mode active for {origin} to {destination}.",
        "key_warnings": ["API bypass active."]
    }

    if not client:
        print("❌ CRITICAL: Request failed because 'client' is None (API Key missing or init failed).")
        print("===========================================\n")
        return jsonify(fallback_response), 200

    prompt = f"""
    You are an AI safety engine for 'Safe Steps', a women's commuting app in India.
    Analyze the route from '{origin}' to '{destination}' at '{time_of_day}'.

    Evaluate real location risks in Delhi/NCR. 
    Vary the score strictly: 
    - Unsafe/night routes: 25-50 (zone_color: "red")
    - Moderate routes: 51-74 (zone_color: "yellow")
    - Safe/daytime routes: 75-95 (zone_color: "green")

    Return ONLY a raw JSON object with keys: safety_score (int), zone_color (string), safety_summary (string), key_warnings (list of strings).
    """

    try:
        print("3. Sending request to Gemini API...")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json', 'temperature': 0.8}
        )
        
        raw_text = response.text or ""
        clean_text = re.sub(r'```json\s*|\s*```', '', raw_text).strip()
        json_data = json.loads(clean_text)
        
        print("✅ SUCCESS: Gemini Returned Dynamic Data:", json_data)
        print("===========================================\n")
        return jsonify(json_data), 200

    except Exception as err:
        print(f"❌ GEMINI API EXCEPTION: {type(err).__name__} -> {str(err)}")
        print("===========================================\n")
        return jsonify(fallback_response), 200