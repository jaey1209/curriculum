function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('교과서 선정대장')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
