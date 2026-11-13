/**
 * Componente único de notificaciones emergentes (Toast).
 */
(function (global) {
  var _toastTimer = null;

  function showToast(msg, durOrErr) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    var isErr = durOrErr === true;
    var dur = typeof durOrErr === 'number' ? durOrErr : 2800;

    el.classList.toggle('err', isErr);
    el.classList.add('on');
    el.classList.add('show');

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      el.classList.remove('on');
      el.classList.remove('show');
    }, dur);
  }

  global.DigiToast = { show: showToast };
  if (typeof global.toast !== 'function') {
    global.toast = showToast;
  }
})(window);
