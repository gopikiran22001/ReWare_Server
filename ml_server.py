from flask import Flask, request, jsonify
import joblib
import pandas as pd
from waitress import serve
import logging


# Load model
model = joblib.load('model_pipeline.pkl')

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        df = pd.DataFrame([data])
        prediction = model.predict(df)[0]
        return jsonify({
            'co2_emissions': round(prediction[0], 2),
            'water_consumption': round(prediction[1], 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    logging.info("🚀 Starting server at http://0.0.0.0:5000")
    serve(app, host='0.0.0.0', port=5000)

