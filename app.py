
import streamlit as st
from PIL import Image
import random

# Dummy-Preise pro Objektklasse
object_prices = {
    "Sofa": 800,
    "Fernseher": 1200,
    "Laptop": 1000,
    "Couchtisch": 300,
    "Stuhl": 150,
    "Bett": 900,
}

# Dummy-Objekterkennung
detected_objects_sample = ["Sofa", "Fernseher", "Couchtisch", "Laptop"]

st.title("🏠 Home Estimate Insurance")
st.write("Lade ein Bild deiner Wohnung hoch, und wir schätzen den Gesamtwert der Einrichtung basierend auf erkannten Objekten.")

# Bild hochladen
uploaded_file = st.file_uploader("Bild hochladen", type=["jpg", "jpeg", "png"])

if uploaded_file:
    image = Image.open(uploaded_file)
    st.image(image, caption="Hochgeladenes Bild", use_column_width=True)

    # "Erkennung" simulieren
    st.subheader("Erkannte Objekte (Demo)")
    detected_objects = random.sample(detected_objects_sample, random.randint(2, 4))

    total_value = 0
    for obj in detected_objects:
        price = object_prices.get(obj, 0)
        total_value += price
        st.write(f"• {obj}: {price} €")

    st.markdown(f"### 💰 Geschätzter Gesamtwert: **{total_value} €**")

else:
    st.info("Bitte lade ein Bild hoch, um die Analyse zu starten.")
