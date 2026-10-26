#import <React/RCTEventEmitter.h>

/// 외장 키보드 단축키를 JS 로 넘긴다.
/// AppDelegate.swift 의 HardwareKeyViewController 가 보낸 알림을 'hardwareKey' 이벤트로 바꾼다
/// (받는 쪽: src/utils/HardwareKeys.ts). JS 가 구독할 때만 알림을 듣는다.
@interface HardwareKeyEmitter : RCTEventEmitter
@end

@implementation HardwareKeyEmitter

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"hardwareKey" ];
}

- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleKey:)
                                               name:@"HardwareKeyPressed"
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:@"HardwareKeyPressed" object:nil];
}

- (void)handleKey:(NSNotification *)notification
{
  [self sendEventWithName:@"hardwareKey" body:notification.userInfo[@"key"]];
}

@end
