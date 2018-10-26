// BUILD PIPELINE WITH DOCKER
node("cicd-build-slaves") {

  // THIS COMMIT_ID WILL BE USED TO TAG OUR DOCKER BUILDS
  def commit_id

  try {

    stage('CHECKOUT') {
      //NOTIFYd
      notifyTeam("STARTED");
      // CLONE THE REPOSITORY INTO THE WORKSPACE
      // SHOULD MATCH THE REPOSITORY DEFINED IN doac.yaml
      // RUN devopsify --status to reveal
      git url: 'REPLACE_ME'
      sh "git rev-parse --short HEAD > .git/commit-id"
      commit_id = readFile('.git/commit-id').trim()
    }

    stage("CODE-QUALITY") {
      // SCAN SOURCE CODE FOR CODE QUALITY
      def sonarqubeScannerHome = tool name: 'sonar', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
      println("SonarhomeInst:" + sonarqubeScannerHome)
      withCredentials([string(credentialsId: 'sonar', variable: 'sonarLogin')]) {
        sh "${sonarqubeScannerHome}/bin/sonar-scanner -e -Dsonar.host.url=https://sonarqube.thevictorgreen.com -Dsonar.login=${sonarLogin} -Dsonar.projectName=vdigital-nodemicro -Dsonar.projectVersion=${commit_id} -Dsonar.projectKey=vdigital-nodemicro -Dsonar.sources=app/ -Dsonar.language=js"
      }
    }

    stage("TEST") {
      // RUN TEST
      dir ("app") {
        def myTestContainer = docker.image('node:8.8.1')
        myTestContainer.pull()
        myTestContainer.inside {
          sh "npm install --only=dev"
          sh "npm test"
        }
      }
    }

    stage("BUILD") {
      // BUILD AND PUSH IMAGE TO DOCKERHUB
      dir ("app") {
        stage("DOCKER BUILD AND TAG WITH COMMIT_ID") {
          // BUILD AND PUSH IMAGE TO DOCKERHUB
          // COPY ID FROM JENKINS CREDENTIALS EXAMPLE ID cba2f3ad-7020-45db-9dc1-cd371a11fd85
          docker.withRegistry("https://index.docker.io/v1/","REPLACE_ME") {
            //DOCKERHUB USERNAME / MICROSERVICE NAME EXAMPLE vdigital/myapp-userportal
            def app = docker.build("REPLACE_ME:${commit_id}","../.").push()
          }
        }
        stage("DOCKER BUILD AND TAG WITH LATEST") {
          // BUILD AND PUSH IMAGE TO DOCKERHUB
          // COPY ID FROM JENKINS CREDENTIALS EXAMPLE ID cba2f3ad-7020-45db-9dc1-cd371a11fd85
          docker.withRegistry("https://index.docker.io/v1/","REPLACE_ME") {
            //DOCKERHUB USERNAME / MICROSERVICE NAME EXAMPLE vdigital/myapp-userportal
            def app = docker.build("REPLACE_ME:latest","../.").push()
          }
        }
      }
    }

    stage("DEPLOY") {
      // DEPLOY IMAGE TO K8S DEVELOPMENT CLUSTER
      println("Deploying App To K8S");
      dir ("k8s/yaml") {
        // SHOULD MATCH NAME OF MICROSERVICE
        // UNCOMMENT AND RUN ONLY OF NEEDED
        //sh "kubectl apply -f REPLACE_ME-db-service.yaml"
        sh "kubectl apply -f REPLACE_ME-service.yaml"
        sh "kubectl apply -f REPLACE_ME-deployment.yaml"
      }
    }

  } catch(e) {
    currentBuild.result = "FAILED";
    throw e;
  }
  finally {
    // ALWAYS SEND NOTIFICATIONS
    notifyTeam(currentBuild.result);
    // ALWAYS CLEAN UP
    cleanUp();
  }
}


def notifyTeam(String buildStatus = 'STARTED') {
  // build status of null means successful
  buildStatus =  buildStatus ?: 'SUCCESSFUL'

  // Default values
  def colorName = 'RED'
  def colorCode = '#FF0000'
  def subject = "${buildStatus}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'"
  def summary = "${subject} (${env.BUILD_URL})"
  def details = """<p>STARTED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p> <p>Check console output at "<a href="${env.BUILD_URL}">${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>"</p>"""

  // Override default values based on build status
  if (buildStatus == 'STARTED') {
    color = 'YELLOW'
    colorCode = '#FFFF00'
  } else if (buildStatus == 'SUCCESSFUL') {
    color = 'GREEN'
    colorCode = '#00FF00'
  } else {
    color = 'RED'
    colorCode = '#FF0000'
  }

  // SEND MESSAGE TO SLACK CHANNEL
  sh "curl -X POST --data-urlencode 'payload={\"channel\": \"#alerts\", \"username\": \"webhookbot\", \"icon_emoji\": \":ghost:\", \"text\": \"This is posted to #alerts and comes from a bot named webhookbot.\"}' https://hooks.slack.com/services/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"
  //slackSend (color: colorCode, message: summary);

}


def cleanUp() {
  cleanWs();
  println("WORKSPACE CLEANED UP");
}
