window.appConfig = {
    maxImageWidth: 800,
    maxImageHeight: 800
  };

window.appConfig.getDeviceId = function getDeviceId() {
  var deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
      deviceId = 'D-' + window.URL.createObjectURL(new Blob([])).split('/').pop();
      localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}