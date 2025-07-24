from flask import Flask, request, jsonify
import joblib
import pandas as pd

# Load model
model = joblib.load('model_pipeline.pkl')

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    df = pd.DataFrame([data])  # Convert input to DataFrame
    prediction = model.predict(df)[0]
    return jsonify({
        'co2_emissions': round(prediction[0], 2),
        'water_consumption': round(prediction[1], 2)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    # print("Server is running http://localhost:5000")
