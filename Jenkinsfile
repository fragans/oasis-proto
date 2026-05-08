pipeline {
  agent any

  /* 
      NOTE: These credentials must be configured in Jenkins:
      - Go to Jenkins Dashboard -> Credentials -> System -> Global credentials
      - Add 'Secret text' for each and give them the IDs used below.
  */
  environment {
    S3_ACCESS_KEY_ID     = credentials('OASIS_HUAWEI_ACCESS_KEY')
    S3_SECRET_ACCESS_KEY = credentials('OASIS_HUAWEI_SECRET_KEY')
    S3_ENDPOINT          = 'obs.ap-southeast-3.myhuaweicloud.com'
    S3_BUCKET            = 'oasis-dashboard-bucket' // Replace with your actual bucket name
    CI                   = 'true' // Tells our script to run non-interactively
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Deploy to Staging') {
      when {
        branch 'staging'
      }
      steps {
        echo '🚀 Starting Staging Deployment...'
        sh 'bash scripts/deploy-staging.sh -y'
      }
    }

    stage('Deploy to Production') {
      when {
        branch 'main'
      }
      steps {
        echo '🚀 Starting Production Deployment...'
        sh 'bash scripts/deploy-prod.sh -y'
      }
    }
  }

  post {
    success {
      echo '✅ Deployment successful!'
    }
    failure {
      echo '❌ Deployment failed. Check the console output above.'
    }
  }
}
