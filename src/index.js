// @flow

import logger from 'log4jcore'
import EventEmitter from '@jcoreio/typed-event-emitter'
import {MessageClient as IPCMessageClient} from 'socket-ipc'
import {VError} from 'verror'
import IronPiIPCCodec, {UNIX_SOCKET_PATH} from '@jcoreio/iron-pi-ipc-codec'
import type {DeviceInputStates, HardwareInfo, MessageFromDriver, SetLEDs, SetOutputs} from '@jcoreio/iron-pi-ipc-codec'

export type {DeviceModel, DetectedDevice} from '@jcoreio/iron-pi-ipc-codec'

const log = logger('iron-pi-device-client')

const codec = new IronPiIPCCodec()

export const EVENT_DEVICE_INPUT_STATES = 'deviceInputStates'
export const EVENT_DEVICES_DETECTED = 'devicesDetected'

export type IronPiDeviceClientEmittedEvents = {
  deviceInputStates: [DeviceInputStates],
  devicesDetected: [HardwareInfo],
  error: [Error],
}

export default class IronPiDeviceClient extends EventEmitter<IronPiDeviceClientEmittedEvents> {

  _ipcClient: Object

  constructor() {
    super()
    const ipcClient = this._ipcClient = new IPCMessageClient(UNIX_SOCKET_PATH, { binary: true })
    ipcClient.on('message', this._onIPCMessage)
    ipcClient.on('error', (err: any) => this.emit('error', new VError(err, 'SPIHubClient socket error')))
  }

  start() {
    this._ipcClient.start()
  }

  setOutputs(setOutputs: SetOutputs) {
    this._ipcClient.send(codec.encodeSetOutputs(setOutputs))
  }

  setLEDs(setLEDs: SetLEDs) {
    this._ipcClient.send(codec.encodeSetLEDs(setLEDs))
  }

  _onIPCMessage = (event: {data: Buffer}) => {
    try {
      const buf: Buffer = event.data
      const msg: MessageFromDriver = codec.decodeMessageFromDriver(buf)
      const {hardwareInfo, deviceInputStates} = msg
      if (hardwareInfo) {
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
