//
//  digitalmentorUITests.swift
//  digitalmentorUITests
//
//  Created by David Leuliette on 16/01/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import XCTest

class digitalmentorUITests: XCTestCase {

  override func setUp() {
    super.setUp()
    
    let app = XCUIApplication()
    setupSnapshot(app)
    app.launch()
  }

  func testExample() {
    snapshot("0Launch")

  }

}
