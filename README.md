
# 🏠 Home Estimate Insurance

**Schätzung des Versicherungswerts von Wohnungseinrichtung mittels Computer Vision**

Dieses Projekt ist ein Proof of Concept für eine KI-gestützte Anwendung, die Bilder aus Wohnungen analysiert und den Gesamtwert der erkannten Einrichtungsgegenstände automatisch schätzt. Ziel ist es, eine einfache, digitale Lösung zur Bewertung von Wohnungseinrichtung z. B. für Versicherungszwecke bereitzustellen.

---

## 🔍 Projektidee

Viele Menschen wissen nicht genau, wie viel ihre Einrichtung wert ist – besonders im Schadensfall ist eine schnelle Einschätzung wichtig. Dieses System nutzt Computer Vision, um typische Gegenstände wie Fernseher, Sofa, Laptop etc. in einem Bild zu erkennen und diesen auf Basis einer Preisdatenbank Werte zuzuordnen.

Am Ende erhält man eine geschätzte Gesamtsumme – etwa für Versicherungsanträge, digitale Schadensmeldungen oder Wohnungsinventuren.

---

## ⚙️ Verwendete Technologien

- **Python** – Hauptprogrammiersprache
- **YOLOv5** – Object Detection Modell zur Objekterkennung im Bild
- **OpenCV** – Bildverarbeitung
- **Streamlit** *(in Entwicklung)* – Benutzeroberfläche zur Interaktion
- **Preisdatenbank** – Interne Logik zur Zuordnung realistischer Preise zu Objekttypen
- **COCO-Datensatz** – Für vorkonfigurierte Objekterkennungsklassen (z. B. `tv`, `couch`, `chair`, `laptop`)

---

## 🧠 Funktionsweise

1. Benutzer lädt ein Foto einer Wohnung hoch (z. B. per Smartphone)
2. YOLOv5 erkennt darin relevante Objekte
3. Jedes erkannte Objekt wird einer Kategorie und einem geschätzten Preis zugeordnet
4. Das System berechnet die Gesamtsumme und zeigt alle Einzelwerte an

---

## 📊 Beispielausgabe

```text
Erkannte Objekte:
- Sofa: 850 €
- Fernseher: 1.200 €
- Laptop: 1.000 €
- Couchtisch: 300 €

👉 Geschätzter Gesamtwert: 3.350 €
```

---

## 🚀 Anwendungsmöglichkeiten

- Digitale Wohnungsbewertung
- Schadensmeldung bei Versicherungen
- Schnelle Inventarübersicht beim Umzug
- Unterstützung bei Versicherungsabschlüssen

---

## 📌 Nächste Schritte

- Integration von **Streamlit** zur Benutzeroberfläche (Bild-Upload + Anzeige)
- Ausbau der Preisdatenbank
- Option zur Anpassung von Objektwerten durch den Nutzer
- Speicherung der Auswertung als PDF oder Bericht

---

## 👨‍💻 Autor

**Mohammad Yasin Faridzad**  
[GitHub-Profil](https://github.com/yasinfaridzad)  
Hamburg, Deutschland  
Data Science & KI-Enthusiast
