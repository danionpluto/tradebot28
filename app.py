import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

from clean_dataset import eval_data, summarize_data

from flask import send_from_directory
import os

import numpy as np


# get api key for openai
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


app = Flask(__name__, static_folder=os.path.join(
    os.getcwd(), 'chat/build'), static_url_path='')


# CORS(
#     app,
#     resources={r"/ask": {"origins": "http://localhost:3000"}},
#     supports_credentials=True,
#     methods=["GET", "POST", "OPTIONS"],
# )
CORS(app, supports_credentials=True)


# cleaning/evaluating data
# summarize_data()
# eval_data()
# get data

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "trade_profits_summary.csv")
df = pd.read_csv(csv_path)

summary_path = os.path.join(base_dir, "trade_summary.csv")
summary = pd.read_csv(summary_path)


def create_prompt(question: str) -> str:
    sample_data = df.to_csv(index=False)
    summarycsv = summary.to_csv(index=False)
    prompt = f"""
            You are a helpful trading assistant AI. Here is a sample of trading data:

            {sample_data}
            
            and some precalculated analysis : {summarycsv}

            First see if these files include any of the calculated values needed to answer this question. 

            Question: {question}
            
            Answer the question clearly but dont provide excess work, just the final answer.
            
            Make sure that you use the monetary amounts when asked about net values, percentages etc. and that you dont include the deposit rows when calculating anything related to profit. 
            
            
            If they ask about general trading advice like minimizing risk, maximizing profits, use knowledge about the market.
            
            Then ask if you can be of any more assitance in a conversational tone.

            Answer:
            """
    return prompt
# debugging stuff


@app.before_request
def log_method():
    print(f"Received {request.method} request at {request.path}")


@app.route('/ask', methods=['OPTIONS'])
def ask_options():
    return '', 200

# route to open ai


@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    question = data.get("question", "")
    is_first = data.get("is_first", False)

    # If it's the first message, greet user and suggest questions
    if is_first:
        welcome_prompt = """You are a friendly AI assistant for analyzing their specific trading data. Start by asking the user how you can assist. Greet the user and encourage them to ask questions."""

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": welcome_prompt}],
                temperature=0.6,
                max_tokens=100,
            )
            answer = response.choices[0].message.content.strip()
            print("Welcome message:", answer)
            return jsonify({"answer": answer})

        except Exception as e:
            print("Error from OpenAI during greeting:", e)
            return jsonify({"error": str(e)}), 500

    # in case input is empty
    if not question:
        print("No question provided")
        return jsonify({"error": "No question provided"}), 400

    # regular question/answer
    prompt = create_prompt(question)

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600,
        )
        answer = response.choices[0].message.content.strip()
        return jsonify({"answer": answer})
    except Exception as e:
        print("Error from OpenAI:", e)
        return jsonify({"error": str(e)}), 500

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "Trades_sample.csv")

@app.route('/api/trades', methods=['GET'])
def get_trades():
    try:
        df = pd.read_csv(csv_path)
        # Replace NaN/NaT with None (so jsonify works properly)
        df = df.replace({np.nan: None})
        data = df.to_dict(orient='records')
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(app.static_folder, 'favicon.ico')


@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')
# added for deployment


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    app.run(debug=True)
