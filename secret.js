function getCredentials () {
  var credentials = {
      stripe : {},
      gmail: {
          port: 465,
          auth:  {
              user: 'your-username',
              pass: 'your-password'
          },
          secureConnection: true,
          host: 'smtp.gmail.com'
      },
      cookieSecret: 'your-cookie-secret'
  }

  // For security purposes, in case of accidental
  // console logs make properties unenumerable
  for (var service in credentials) {
    Object.defineProperty(credentials, service, {enumerable: false})
  }

  return credentials
}

module.exports = getCredentials()
