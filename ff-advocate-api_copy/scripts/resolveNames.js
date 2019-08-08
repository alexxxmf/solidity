module.exports.domainName = serverless => {
    serverless.cli.consoleLog("In function domainName");
    // serverless.cli.consoleLog(util.inspect(serverless));
  
    const stageName = serverless.processedInput.options.stage
      ? serverless.processedInput.options.stage
      : serverless.service.provider.stage;
  
    serverless.cli.consoleLog(`Resolved stage name ${stageName}`);

    const domainName =
      stageName === "prod" ? `advocate-api.freeformers.com` : `advocate-api-${stageName}.freeformers.com`;
  
    serverless.cli.consoleLog(`Using domain name ${domainName}`);
  
    return domainName;
};

