#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(IDCardOCRModule, NSObject)

RCT_EXTERN_METHOD(recognizeIDCard:(NSString *)imageUri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(preprocessImage:(NSString *)imageUri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

