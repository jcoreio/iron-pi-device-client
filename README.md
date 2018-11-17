# Iron Pi Device Client

Client library for reading and writing Iron Pi input and output states

## Installation

`npm install --save @jcoreio/iron-pi-device-client`

or

`yarn add @jcoreio/iron-pi-device-client`

## Usage

```js
const {IronPiDeviceClient} = require('@jcoreio/iron-pi-device-client')

const client = new IronPiDeviceClient()

client.start()
```

#### Getting detected hardware

```js
client.on('devicesDetected', hardware => console.log(hardware))
```

Output: 

```json
{
  "devices": [
    {
      "address": 1,
      "ioOffset": 0,
      "model": {
        "name": "iron-pi-cm8",
        "version": "1.0.0",
        "numDigitalInputs": 8,
        "numDigitalOutputs": 8,
        "numAnalogInputs": 4,
        "hasConnectButton": true
      }
    },
    {
      "address": 2,
      "ioOffset": 8,
      "model": {
        "name": "iron-pi-io16",
        "version": "1.0.0",
        "numDigitalInputs": 16,
        "numDigitalOutputs": 16,
        "numAnalogInputs": 8,
        "hasConnectButton": false
      }
    }
  ],
  "serialNumber": "ABCDEF",
  "accessCode": "MNOPQRST"
}
```

#### Getting device input states

```js
client.on('deviceInputStates', deviceInputStates => console.log(deviceInputStates))
```

```json
{
  "inputStates": [
    {
      "address": 1,
      "ioOffset": 0,
      "digitalInputs": [true, false, false, false, false, true, true, false],
      "digitalInputEventCounts": [1, 0, 0, 0, 0, 2, 2, 0],
      "digitalOutputs": [false, false, false, false, false, false, false, false],
      "analogInputs": [4.98, 0, 0, 0],
      "connectButtonPressed": false,
      "connectButtonEventCount": 0
    }
  ]
}

```

#### Setting output states

```js
client.setOutputs({outputs: [
  {
    address: 1,
    levels: [true, true, true, true, false, false, false, false]
  },
]})
```

#### Sending LED messages

```js
client.setLEDs({leds: [
  {
    address: 1,
    colors: 'ggr'
  },
  {
    address: 2,
    colors: 'ggr'
  },
]})
```

Messages are sent independently to each board.

The `colors` field indicates a sequence of colors. For example, `ggr` would flash a pattern of green, green, and red.

Supported colors are:
- `g`: green
- `r`: red
- `y`: yellow

## License

 [Apache-2.0](LICENSE)