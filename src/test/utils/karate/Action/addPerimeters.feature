Feature: Add perimeters/group for action test 

  Background:
   #Getting token for admin and operator1 user calling getToken.feature
    * def signIn = call read('../common/getToken.feature') { username: 'admin'}
    * def authToken = signIn.authToken

    * def groupAction =
"""
{
  "id" : "groupAction",
  "name" : "groupAction",
  "description" : "group for action test "
}
"""

    * def perimeterAction =
"""
{
  "id" : "perimeterAction",
  "process" : "processAction",
  "stateRights" : [
    {
      "state" : "state1",
      "right" : "Receive"
    }
  ]
}
"""


  Scenario: Create groupAction
    Given url opfabUrl + 'users/groups'
    And header Authorization = 'Bearer ' + authToken
    And request groupAction
    When method post
    Then status 201


  Scenario: Create perimeterAction
    Given url opfabUrl + 'users/perimeters'
    And header Authorization = 'Bearer ' + authToken
    And request perimeterAction
    When method post
    Then status 201


  Scenario: Add perimeterAction for groupAction
    Given url opfabUrl + 'users/groups/groupAction/perimeters'
    And header Authorization = 'Bearer ' + authToken
    And request ["perimeterAction"]
    When method patch
    Then status 200


  Scenario: Add users to a group
    Given url opfabUrl + 'users/groups/groupAction/users'
    And header Authorization = 'Bearer ' + authToken
    And request ["operator1", "operator1-admin", "operator3"]
    When method patch
    And status 200