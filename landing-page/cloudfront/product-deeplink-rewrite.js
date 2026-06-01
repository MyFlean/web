// CloudFront Function (viewer-request) for flean.ai — deployed as flean-score-rewrite-index
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === '/onelink' || uri === '/onelink/') {
    request.uri = '/onelink/index.html';
    return request;
  }

  if (uri.startsWith('/onelink/') && uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  if (uri === '/flean-score' || uri === '/flean-score/') {
    request.uri = '/flean-score/index.html';
    return request;
  }

  if (uri.startsWith('/flean-score/') && uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  if (uri.startsWith('/product/') &&
      uri !== '/product/deeplink.html' &&
      !uri.endsWith('.html')) {
    var segments = uri.split('/').filter(function (segment) {
      return segment.length > 0;
    });
    if (segments.length >= 2 && segments[0] === 'product') {
      request.uri = '/product/deeplink.html';
    }
  }

  return request;
}
