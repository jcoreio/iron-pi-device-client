// @flow

import logger from 'log4jcore'
import EventEmitter from '@jcoreio/typed-event-emitter'
import {MessageClient as IPCMessageClient} from 'socket-ipc'
import VError from 'verror'
import IronPiIPCCodec, {UNIX_SOCKET_PATH} from '@jcoreio/iron-pi-ipc-codec'
import type {DeviceInputStates, HardwareInfo, MessageFromDriver, SetLEDs, SetOutputs} from '@jcoreio/iron-pi-ipc-codec'

export type {DetectedDevice, DeviceInputState, DeviceInputStates, DeviceModel, DeviceOutputState, HardwareInfo, LEDCommand, SetLEDs, SetOutputs} from '@jcoreio/iron-pi-ipc-codec'

const log = logger('iron-pi-device-client')

const codec = new IronPiIPCCodec()

export const EVENT_DEVICE_INPUT_STATES = 'deviceInputStates'
export const EVENT_DEVICES_DETECTED = 'devicesDetected'

export type IronPiDeviceClientEmittedEvents = {
  deviceInputStates: [DeviceInputStates],
  devicesDetected: [HardwareInfo],
  error: [Error],
  connection: [], // indicates a new connection to the UNIX socket used to communicate with the driver
  close: [], // indicates closing the UNIX socket used to communicate with the driver
}

export class IronPiDeviceClient extends EventEmitter<IronPiDeviceClientEmittedEvents> {

  _ipcClient: Object
  _hardwareInfo: ?HardwareInfo

  /**
   * @param unixSocketPath Optional override of default UNIX socket path, which is '/tmp/socket-iron-pi'.
   */
  constructor({ unixSocketPath }: { unixSocketPath?: ?string }) {
    super()
    const ipcClient = this._ipcClient = new IPCMessageClient(unixSocketPath || UNIX_SOCKET_PATH, { binary: true })
    ipcClient.on('message', this._onIPCMessage)
    ipcClient.on('error', (err: any) => this.emit('error', new VError(err, 'IronPiDeviceClient socket error')))
    ipcClient.on('connection', () => this.emit('connection'))
    ipcClient.on('close', () => this.emit('close'))
  }

  start() {
    this._ipcClient.start()
  }

  hardwareInfo(): ?HardwareInfo {
    return this._hardwareInfo
  }

  setOutputs(setOutputs: SetOutputs) {
    const {outputs} = setOutputs
    if (!Array.isArray(outputs) || outputs.find(out => typeof out !== 'object')) throw Error('outputs property must be an array of Objects with the format {address: number, levels: Array<boolean>}')
    this._ipcClient.send(codec.encodeSetOutputs(setOutputs))
  }

  setLEDs(setLEDs: SetLEDs) {
    const {leds} = setLEDs
    if (!Array.isArray(leds) || leds.find(cmd => typeof cmd !== 'object')) throw Error('leds property must be an array of Objects with the format {address: number, colors: string, onTime: number, offTime: number, idleTime: number}')
    this._ipcClient.send(codec.encodeSetLEDs(setLEDs))
  }

  _onIPCMessage = (event: {data: Buffer}) => {
    try {
      const buf: Buffer = event.data
      const msg: MessageFromDriver = codec.decodeMessageFromDriver(buf)
      const {hardwareInfo, deviceInputStates} = msg
      if (hardwareInfo) {
        this._hardwareInfo = hardwareInfo
        this.emit(EVENT_DEVICES_DETECTED, hardwareInfo)
      }
      if (deviceInputStates) {
        this.emit(EVENT_DEVICE_INPUT_STATES, deviceInputStates)
      }
    } catch (err) {
      log.error('could not process an incoming IPC message', err)
    }
  }
}

export default IronPiDeviceClient
