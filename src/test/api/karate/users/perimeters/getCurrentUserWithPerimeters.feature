Feature: Get current user with perimeters (endpoint tested : GET /CurrentUserWithPerimeters)

  Background:
   #Getting token for admin and tso1-operator user calling getToken.feature
    * def signIn = call read('../../common/getToken.feature') { username: 'admin'}
    * def authToken = signIn.authToken
    * def signInAsTSO = call read('../../common/getToken.feature') { username: 'tso1-operator'}
    * def authTokenAsTSO = signInAsTSO.authToken

    * def group15 =
"""
{
  "id" : "groupKarate15",
  "name" : "groupKarate15 name",
  "description" : "groupKarate15 description"
}
"""

    * def group16 =
"""
{
  "id" : "groupKarate16",
  "name" : "groupKarate16 name",
  "description" : "groupKarate16 description"
}
"""

    * def perimeter15_1_R =
"""
{
  "id" : "perimeterKarate15_1_R",
  "process" : "process15",
  "state" : "state1",
  "rights" : "Read"
}
"""

    * def perimeter15_1_RR =
"""
{
  "id" : "perimeterKarate15_1_RR",
  "process" : "process15",
  "state" : "state1",
  "rights" : "ReadAndRespond"
}
"""

    * def perimeter15_2 =
"""
{
  "id" : "perimeterKarate15_2",
  "process" : "process15",
  "state" : "state2",
  "rights" : "ReadAndWrite"
}
"""
    * def tso1operatorArray =
"""
[   "tso1-operator"
]
"""
    * def group15group16Array =
"""
[   "groupKarate15", "groupKarate16"
]
"""
    * def group15Array =
"""
[   "groupKarate15"
]
"""
    * def group16Array =
"""
[   "groupKarate16"
]
"""

  Scenario: Get current user with perimeters with tso1-operator
    Given url opfabUrl + 'users/CurrentUserWithPerimeters'
    And header Authorization = 'Bearer ' + authTokenAsTSO
    When method get
    Then status 200
    And match response.userData.login == 'tso1-operator'
    And assert response.computedPerimeters.length == 0


  Scenario: get current user with perimeters without authentication
    Given url opfabUrl + 'users/CurrentUserWithPerimeters'
    When method get
    Then status 401


  Scenario: Create group15
    Given url opfabUrl + 'users/groups'
    And header Authorization = 'Bearer ' + authToken
    And request group15
    When method post
    Then status 201
    And match response.description == group15.description
    And match response.name == group15.name
    And match response.id == group15.id


  Scenario: Create group16
    Given url opfabUrl + 'users/groups'
    And header Authorization = 'Bearer ' + authToken
    And request group16
    When method post
    Then status 201
    And match response.description == group16.description
    And match response.name == group16.name
    And match response.id == group16.id


  Scenario: Add tso1-operator to group15
    Given url opfabUrl + 'users/groups/' + group15.id + '/users'
    And header Authorization = 'Bearer ' + authToken
    And request tso1operatorArray
    When method patch
    And status 200


  Scenario: Add tso1-operator to group16
    Given url opfabUrl + 'users/groups/' + group16.id + '/users'
    And header Authorization = 'Bearer ' + authToken
    And request tso1operatorArray
    When method patch
    And status 200


  Scenario: Create perimeter15_1_R
    Given url opfabUrl + 'users/perimeters'
    And header Authorization = 'Bearer ' + authToken
    And request perimeter15_1_R
    When method post
    Then status 201
    And match response.id == perimeter15_1_R.id
    And match response.process == perimeter15_1_R.process
    And match response.state == perimeter15_1_R.state
    And match response.rights == perimeter15_1_R.rights


  Scenario: Create perimeter15_1_RR
    Given url opfabUrl + 'users/perimeters'
    And header Authorization = 'Bearer ' + authToken
    And request perimeter15_1_RR
    When method post
    Then status 201
    And match response.id == perimeter15_1_RR.id
    And match response.process == perimeter15_1_RR.process
    And match response.state == perimeter15_1_RR.state
    And match response.rights == perimeter15_1_RR.rights


  Scenario: Create perimeter15_2
    Given url opfabUrl + 'users/perimeters'
    And header Authorization = 'Bearer ' + authToken
    And request perimeter15_2
    When method post
    Then status 201
    And match response.id == perimeter15_2.id
    And match response.process == perimeter15_2.process
    And match response.state == perimeter15_2.state
    And match response.rights == perimeter15_2.rights


  Scenario: Put group15 and group16 for perimeter15_1_R
    Given url opfabUrl + 'users/perimeters/'+ perimeter15_1_R.id + '/groups'
    And header Authorization = 'Bearer ' + authToken
    And request group15group16Array
    When method put
    Then status 200


  Scenario: Put group15 for perimeter15_2
    Given url opfabUrl + 'users/perimeters/'+ perimeter15_2.id + '/groups'
    And header Authorization = 'Bearer ' + authToken
    And request group15Array
    When method put
    Then status 200


  Scenario: Put group16 for perimeter15_1_RR
    Given url opfabUrl + 'users/perimeters/'+ perimeter15_1_RR.id + '/groups'
    And header Authorization = 'Bearer ' + authToken
    And request group16Array
    When method put
    Then status 200


  Scenario: Get current user with perimeters with tso1-operator
    Given url opfabUrl + 'users/CurrentUserWithPerimeters'
    And header Authorization = 'Bearer ' + authTokenAsTSO
    When method get
    Then status 200
    And match response.userData.login == 'tso1-operator'
    And assert response.computedPerimeters.length == 2
    And match response.computedPerimeters contains only [{"process":"process15","state":"state1","rights":"ReadAndRespond"}, {"process":"process15","state":"state2","rights":"ReadAndWrite"}]


  Scenario: Delete user tso1-operator from group15
    Given url opfabUrl + 'users/groups/' + group15.id  + '/users/tso1-operator'
    And header Authorization = 'Bearer ' + authToken
    When method delete
    Then status 200

  Scenario: Delete user tso1-operator from group16
    Given url opfabUrl + 'users/groups/' + group16.id  + '/users/tso1-operator'
    And header Authorization = 'Bearer ' + authToken
    When method delete
    Then status 200