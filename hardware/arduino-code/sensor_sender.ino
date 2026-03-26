#include <DHT.h>

// ====== PIN DEFINITIONS ======
#define DHTPIN 2          
#define DHTTYPE DHT22     
#define SOIL_PIN A0       

// ====== OBJECT CREATION ======
DHT dht(DHTPIN, DHTTYPE);

// ====== VARIABLES ======
float temperature = 0;
float humidity = 0;
int soilValue = 0;

// ====== SETUP ======
void setup() {
  Serial.begin(9600);
  dht.begin();

  Serial.println("System Initializing...");
  delay(2000);
}

// ====== LOOP ======
void loop() {

  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Error reading from DHT sensor!");
  } else {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" °C  |  ");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.print(" %  |  ");
  }

  soilValue = analogRead(SOIL_PIN);

  Serial.print("Soil Moisture: ");
  Serial.print(soilValue);

  if (soilValue < 300) {
    Serial.println(" (Very Wet)");
  } else if (soilValue < 600) {
    Serial.println(" (Moist)");
  } else {
    Serial.println(" (Dry)");
  }

  Serial.println("-----------------------------------");

  delay(2000);
}