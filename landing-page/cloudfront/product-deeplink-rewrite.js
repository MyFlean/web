// CloudFront Function (viewer-request) for flean.ai
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (!uri.startsWith('/product/')) {
    return request;
  }

  if (uri === '/product/deeplink.html' || uri.endsWith('.html')) {
    return request;
  }

  var segments = uri.split('/').filter(function (segment) {
    return segment.length > 0;
  });

  if (segments.length >= 2 && segments[0] === 'product') {
    request.uri = '/product/deeplink.html';
  }

  return request;
}
