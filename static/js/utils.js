window.appConfig = {
    maxImageWidth: 1000,
    maxImageHeight: 1000
  };

window.appConfig.getDeviceId = function getDeviceId() {
  var deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
      deviceId = 'D-' + window.URL.createObjectURL(new Blob([])).split('/').pop();
      localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}