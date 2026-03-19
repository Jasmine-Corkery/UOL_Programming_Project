const NativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');
if (!NativeModules.default) {
  NativeModules.default = NativeModules;
}
