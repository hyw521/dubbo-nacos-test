# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#!/usr/bin/env sh

# build java dubbo jar
cd ./dubbo-java/dubbo-demo
mvn clean install
cd dubbo-demo-provider-with-zookeeper
mvn clean package

# start zookeeper cluster
docker-compose -f ../../zookeeper-docker/docker-compose.yml up &
# start java dubbo service
java -jar ./target/dubbo-demo-provider-with-zookeeper-2.7.4.1-jar-with-dependencies.jar
