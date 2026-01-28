from flask import Flask, request, jsonify
import re
import os
from supabase import create_client, Client
from datetime import datetime

app = Flask(__name__)

# Supabase Setup
url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # MUST use service role key for backend inserts bypassing RLS if needed, or ensuring write access
supabase: Client = create_client(url, key)

@app.route('/api/sms', methods=['POST'])
def handle_sms():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        message = data.get("message", "")
        sender = data.get("sender", "")
        # Optional: User ID from payload or Env Var (Default to a known user if single-tenant)
        # For now, we expect 'user_id' in payload OR we might need to query a profile by phone number (if implemented)
        # We will default to a fallback env var if provided, or return error.
        user_id = data.get("user_id") or os.environ.get("DEFAULT_USER_ID") or "8400431f-8ca9-4c28-925b-26ee4207bc38"

        if not user_id:
             return jsonify({"error": "User ID missing. Please provide user_id in payload or configure DEFAULT_USER_ID"}), 400

        # Regex Parsing
        # Looking for "rs <amount>" or similar patterns. 
        # Case insensitive, optional dot after rs, optional space, decimal support.
        match = re.search(r'(?:rs|inr)\.?\s*(\d+(?:\.\d{1,2})?)', message, re.IGNORECASE)
        
        amount = 0.0
        if match:
            amount = float(match.group(1))
        else:
            # Fallback: check if the message IS just a number
            try:
                amount = float(message.strip())
            except ValueError:
                return jsonify({"error": "Could not parse amount from message"}), 400

        # Data construction
        expense_data = {
            "user_id": user_id,
            "amount": amount,
            "category": "Others",
            "date": datetime.now().isoformat(),
            "note": f"SMS from {sender}: {message}",
            "createdAt": int(datetime.now().timestamp() * 1000) # Match frontend format (ms)
        }

        # Insert to Supabase
        response = supabase.table("expenses").insert(expense_data).execute()

        return jsonify({"success": True, "data": response.data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Vercel requires this for serverless functions
if __name__ == '__main__':
    app.run()
