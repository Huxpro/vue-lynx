// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Testing

import SparklingMethod

protocol TestService {
    var value: String { get }
}

class TestServiceImpl: TestService {
    let value: String
    
    init(value: String = "test") {
        self.value = value
    }
}

class AnotherTestService {
    let id: Int
    
    init(id: Int = 42) {
        self.id = id
    }
}

@MainActor
struct DefaultDIContainerProviderTest {
    
    @Test func testInject() throws {
        DIProviderRegistry.provider = nil
        
        DefaultDIContainerProvider.inject()
        
        #expect(DIProviderRegistry.provider != nil)
        #expect(DIProviderRegistry.provider is DefaultDIContainerProvider)
    }
    
    @Test func testPipeShared() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        
        let container1 = provider.pipeShared()
        let container2 = provider.pipeShared()
        
        #expect(ObjectIdentifier(container1 as AnyObject) == ObjectIdentifier(container2 as AnyObject))
    }
    
    @Test func testContainer() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        
        let container1 = provider.container()
        let container2 = provider.container()
        
        #expect(ObjectIdentifier(container1 as AnyObject) != ObjectIdentifier(container2 as AnyObject))
    }
    
    @Test func testContainerAndPipeSharedAreDifferent() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        
        let pipeShared = provider.pipeShared()
        let container = provider.container()
        
        #expect(ObjectIdentifier(pipeShared as AnyObject) != ObjectIdentifier(container as AnyObject))
    }
    
    @Test func testDIProviderRegistryAccess() throws {
        DefaultDIContainerProvider.inject()
        
        let provider = DIProviderRegistry.provider!
        
        let pipeShared = provider.pipeShared()
        let container = provider.container()
        
        #expect(pipeShared != nil)
        #expect(container != nil)
        #expect(ObjectIdentifier(pipeShared as AnyObject) != ObjectIdentifier(container as AnyObject))
    }
    
    @Test func testContainerRegisterAndResolveTransient() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        let container = provider.container()
        
        container.register(TestService.self, scope: .transient) {
            TestServiceImpl(value: "transient")
        }
        
        let service1 = container.resolve(TestService.self)
        let service2 = container.resolve(TestService.self)
        
        #expect(service1 != nil)
        #expect(service2 != nil)
        #expect(service1?.value == "transient")
        #expect(service2?.value == "transient")
        #expect(ObjectIdentifier(service1! as AnyObject) != ObjectIdentifier(service2! as AnyObject))
    }
    
    @Test func testContainerRegisterAndResolveContainer() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        let container = provider.container()
        
        container.register(TestService.self, scope: .container) {
            TestServiceImpl(value: "container")
        }
        
        let service1 = container.resolve(TestService.self)
        let service2 = container.resolve(TestService.self)
        
        #expect(service1 != nil)
        #expect(service2 != nil)
        #expect(service1?.value == "container")
        #expect(service2?.value == "container")
        #expect(ObjectIdentifier(service1! as AnyObject) == ObjectIdentifier(service2! as AnyObject))
    }
    
    @Test func testContainerRegisterWithName() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        let container = provider.container()
        
        container.register(TestService.self, name: "named") {
            TestServiceImpl(value: "named_service")
        }
        
        container.register(TestService.self) {
            TestServiceImpl(value: "default_service")
        }
        
        let namedService = container.resolve(TestService.self, name: "named")
        let defaultService = container.resolve(TestService.self)
        
        #expect(namedService?.value == "named_service")
        #expect(defaultService?.value == "default_service")
        #expect(ObjectIdentifier(namedService! as AnyObject) != ObjectIdentifier(defaultService! as AnyObject))
    }
    
    @Test func testContainerResolveUnregisteredService() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        let container = provider.container()
        
        let service = container.resolve(AnotherTestService.self)
        
        #expect(service == nil)
    }
    
    @Test func testPipeSharedRegisterAndResolve() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        let pipeShared = provider.pipeShared()
        
        pipeShared.register(AnotherTestService.self) {
            AnotherTestService(id: 100)
        }
        
        let service = pipeShared.resolve(AnotherTestService.self)
        
        #expect(service != nil)
        #expect(service?.id == 100)
    }
    
    @Test func testPipeSharedPersistenceAcrossProviderInstances() throws {
        DefaultDIContainerProvider.inject()
        let provider1 = DIProviderRegistry.provider!
        let pipeShared1 = provider1.pipeShared()
        
        pipeShared1.register(AnotherTestService.self) {
            AnotherTestService(id: 200)
        }
        
        DefaultDIContainerProvider.inject()
        let provider2 = DIProviderRegistry.provider!
        let pipeShared2 = provider2.pipeShared()
        
        let service = pipeShared2.resolve(AnotherTestService.self)
        
        #expect(service != nil)
        #expect(service?.id == 200)
        #expect(ObjectIdentifier(pipeShared1 as AnyObject) == ObjectIdentifier(pipeShared2 as AnyObject))
    }
    
    @Test func testContainerIsolationBetweenInstances() throws {
        DefaultDIContainerProvider.inject()
        let provider = DIProviderRegistry.provider!
        let container1 = provider.container()
        let container2 = provider.container()
        
        container1.register(TestService.self) {
            TestServiceImpl(value: "container1")
        }
        
        let service1 = container1.resolve(TestService.self)
        let service2 = container2.resolve(TestService.self)
        
        #expect(service1?.value == "container1")
        #expect(service2 == nil)
    }
}