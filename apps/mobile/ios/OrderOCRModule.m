#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(OrderOCRModule, NSObject)

RCT_EXTERN_METHOD(recognizeOrderScreenshot:(NSString *)imageUri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

