#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include "DHT.h"

#define DHTPIN 2
#define DHTTYPE DHT11

#define SOIL_SENSOR A0
#define LIGHT_SENSOR A1

DHT dht(DHTPIN, DHTTYPE);

char ssid[] = "YOUR_WIFI_NAME";
char password[] = "YOUR_WIFI_PASSWORD";

char serverAddress[] = "192.168.1.10";  
int port = 5000;

WiFiClient wifi;
HttpClient client = HttpClient(wifi, serverAddress, port);

void setup() {

  Serial.begin(9600);
  dht.begin();

  while (!Serial);

  Serial.println("Connecting to WiFi...");

  while (WiFi.begin(ssid, password) != WL_CONNECTED) {
    delay(2000);
    Serial.println("Retrying WiFi...");
  }

  Serial.println("WiFi Connected");
}

void loop() {

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  int soilValue = analogRead(SOIL_SENSOR);
  int lightValue = analogRead(LIGHT_SENSOR);

  int soilPercent = map(soilValue, 1023, 0, 0, 100);

  Serial.println("Sending Sensor Data...");
  Serial.print("Soil: ");
  Serial.println(soilPercent);

  Serial.print("Temp: ");
  Serial.println(temperature);

  Serial.print("Humidity: ");
  Serial.println(humidity);

  Serial.print("Light: ");
  Serial.println(lightValue);

  String jsonData = "{";
  jsonData += "\"soil\":" + String(soilPercent) + ",";
  jsonData += "\"temperature\":" + String(temperature) + ",";
  jsonData += "\"humidity\":" + String(humidity) + ",";
  jsonData += "\"light\":" + String(lightValue);
  jsonData += "}";

  client.beginRequest();
  client.post("/api/sensor");
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Content-Length", jsonData.length());
  client.beginBody();
  client.print(jsonData);
  client.endRequest();

  int statusCode = client.responseStatusCode();

  Serial.print("Server Response: ");
  Serial.println(statusCode);

  delay(5000);
}