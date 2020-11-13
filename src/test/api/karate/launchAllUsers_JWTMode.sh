#/bin/sh

# Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
# See AUTHORS.txt
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
# This file is part of the OperatorFabric project.

# Be careful : patchUserSettings must be before fetchUserSettings

java -jar karate.jar                                         \
      users/createUsers.feature                              \
      users/groups/createGroups.feature                      \
      users/groups/addUsersToGroup.feature                   \
      users/entities/createEntities.feature                  \
      users/entities/addUsersToEntity.feature                \
      users/perimeters/createPerimeters.feature              \
      users/perimeters/addGroupsToPerimeter.feature          \
      users/patchUserSettings.feature                        \
      users/fetchExistingUser.feature                        \
      users/fetchUserSettings.feature                        \
      users/groups/getGroupDetails.feature                   \
      users/groups/getGroups.feature                         \
      users/entities/getEntityDetails.feature                \
      users/entities/getEntities.feature                     \
      users/perimeters/getPerimeterDetails.feature           \
      users/perimeters/getPerimeters.feature                 \
      users/getUsers.feature                                 \
      users/groups/updateExistingGroup.feature               \
      users/entities/updateExistingEntity.feature            \
      users/perimeters/updateExistingPerimeter.feature       \
      users/updateExistingUser.feature                       \
      users/groups/updateListOfGroupUsers.feature            \
      users/groups/deleteAllUsersFromAGroup.feature          \
      users/groups/deleteUserFromGroup.feature               \
      users/entities/updateListOfEntityUsers.feature         \
      users/entities/deleteAllUsersFromAnEntity.feature      \
      users/entities/deleteUserFromEntity.feature            \
      users/perimeters/updateListOfPerimeterGroups.feature   \
      users/perimeters/deleteAllGroupsFromAPerimeter.feature \
      users/perimeters/deleteGroupFromPerimeter.feature      \
      users/perimeters/getPerimetersForAUser.feature         \
      users/perimeters/getPerimetersForAGroup.feature        \
      users/perimeters/updatePerimetersForAGroup.feature     \
      users/perimeters/addPerimetersForAGroup.feature        \
      users/perimeters/getCurrentUserWithPerimeters_JWTMode.feature

