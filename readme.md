# SAFEGateway

A Example application to serve as POC for the SAFE network to expose RESTFull services for developers and also support 
browsers without any addon put through a thing WEB-2-SAFE Proxy server.  

# How does it work

Run the SAFEGateway application. Click on the login button. Once the user authenticates a fix RESTFull server is started.
The RESTFull services would expose API that would help the developers to easily communicate with the SAFENetwork.

The application will also start a WEB-2-SAFE proxy server. The purpose of the proxy server is to allow the browsers to
serve the **public content** from the SAFENetwork. The `WEB-2-SAFE proxy` will proxy only the urls with `*.safenet` extensions.

```
For eg,
 http://krishna.safenet
 http://blog.krishna.safenet
```

The proxy would act as a unregistered client and fetch **public content** from the SAFENetwork.
 
The APIs can be invoked directly pointing to the localhost:API_PORT (localhost:3000) end points. 
This request wont be proxied as it is directly targeted to the localhost.
 
Alternatively, the XHR web requests can also be posted to `api.safenet`, the requests to the endpoint will be proxied to 
the API Server automatically.  

In order to use the `WEB-2-SAFE proxy` the browser setting should be configured to use the proxy.

#### Proxy Configuration:

##### Windows
1. Control Panel > Network & Internet > Internet options
2. Internet Properties dialog is opened. Open `Connections` tab and select `LAN Settings`
3. Select `Use automatic configuration script` and in the Address box set `http://localhost:3000/pac-file` 
4. Save the settings
5. Open browser and start using. Test with `maidsafe.safenet` & `drive.maidsafe.safenet`      

If Windows configuration is followed then the below configurations is not needed. browsers use the System network 
configurations by default. Below are the configurations through each browser. Chrom and Ie directly configure the 
System's configuration. While firefoc and safari provide option to configure proxy for the application specifically. 

#### Chrome configuration
Open Advanced Setting and click on the Change Proxy settings under the Network option. Follow steps from 2 from
 Windows configuration section

#### IE Configuration
Open Tools > intenet options and follow steps 2 from Windows Configuration

#### Firefox
Go to settings > Advanced > Network > Connections > Click on Settings button. Select Atomatic procy confiuguration URL 
and paste the pac file url (http://localhost:3000/pac-file)

#### Safari
Setting reference is linked [here](http://www.lib.berkeley.edu/using-the-libraries/proxy-safari-mac-osx-snow-leopard)


## Dev

```
$ npm install
```

### Run

```
$ npm start
```

### Build

```
$ npm run build
$ npm run build-osx
```

Builds the app for OS X and Windows, using [electron-packager](https://github.com/maxogden/electron-packager).
