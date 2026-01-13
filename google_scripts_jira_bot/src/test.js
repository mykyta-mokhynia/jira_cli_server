function testConnection() {
    console.log("Testing external connection...");
    const response = UrlFetchApp.fetch("https://www.google.com");
    console.log("Response code: " + response.getResponseCode());
}
