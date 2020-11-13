Feature: Bundle

  Background:
    # Get admin token
    * def signIn = call read('../common/getToken.feature') { username: 'admin'}
    * def authToken = signIn.authToken

    # Get TSO-operator
    * def signInAsTSO = call read('../common/getToken.feature') { username: 'operator1'}
    * def authTokenAsTSO = signInAsTSO.authToken

  Scenario: Post Bundle

    # Push bundle
    Given url opfabUrl + '/businessconfig/processes'
    And header Authorization = 'Bearer ' + authToken
    And multipart field file = read('resources/bundle_api_test.tar.gz')
    When method post
    Then print response
    And status 201

  Scenario: Post Bundle without authentication
    # for the time being returns 403 instead of 401
    Given url opfabUrl + '/businessconfig/processes'
    And multipart field file = read('resources/bundle_api_test.tar.gz')
    When method post
    Then print response
    And status 401


  Scenario: Post Bundle without admin role
        # for the time being returns 401 instead of 403
    Given url opfabUrl + '/businessconfig/processes'
    And header Authorization = 'Bearer ' + authTokenAsTSO
    And multipart field file = read('resources/bundle_api_test.tar.gz')
    When method post
    Then print response
    And status 403


  Scenario: Post Bundle for the same publisher but with another version

    # Push bundle
    Given url opfabUrl + '/businessconfig/processes'
    And header Authorization = 'Bearer ' + authToken
    And multipart field file = read('resources/bundle_api_test_v2.tar.gz')
    When method post
    Then print response
    And status 201
  
  
  Scenario: Post Bundle for testing the action

    # Push bundle
    Given url opfabUrl + '/businessconfig/processes'
    And header Authorization = 'Bearer ' + authToken
    And multipart field file = read('resources/bundle_test_action.tar.gz')
    When method post
    Then print response
    And status 201

    Scenario: Post Bundle for big card (apogee)

    # Push bundle
    Given url opfabUrl + '/businessconfig/processes'
    And header Authorization = 'Bearer ' + authToken
    And multipart field file = read('resources/bundle_api_test_apogee.tar.gz')
    When method post
    Then print response
    And status 201

