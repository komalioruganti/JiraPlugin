import ForgeUI, { render, ProjectPage, Fragment, Text, useState, useAction, useProductContext, Heading, Button, Form, Select, Option, Macro, Table, Head, Cell, Row } from '@forge/ui';
import api, { route } from '@forge/api';
import { storage, startsWith } from '@forge/api';


const Issue = props => {
  return (
    <Fragment>
      <Text>Issue key: {props.issueKey}</Text>
      <Text>Issue summary: {props.summary}</Text>
    </Fragment>
  );
};


const App = () => {
  const [formState, setFormState] = useState(undefined);
  const context = useProductContext();
  const projectKey = context.platformContext.projectKey;

  const [issues] = useState(async () => await getIssues(projectKey));

  const onSubmitFunction = async (formData) => {
    const issueData = await getIssue(formData.selectedIssue);
    setFormState(issueData);
  };

  const handleClick = async () => {
    const issuesData = await getIssuesDetails(projectKey);
    console.log(issuesData);
  };
  
  const handleClickTest = async () => {
    await testHit(); // Calls the testHit function to fetch from the API
  };

  return (
    <Fragment>
      <Heading size="large">Customise UI using UI Kit</Heading>
      <Heading size="medium">Issue list:</Heading>

      {issues.map(issue =>
        <Issue key={issue.key} issueKey={issue.key} summary={issue.summary} />
      )}

      <Button text='Get Issues Data' onClick={handleClick}></Button>
      <Button text='Test' onClick={handleClickTest}></Button>

      <Form onSubmit={onSubmitFunction}>
        <Select label="Select issue" name="selectedIssue" isRequired={true}>
          {issues.map(issue =>
            <Option key={issue.key} label={issue.key} value={issue.key} />
          )}
        </Select>
      </Form>

      {formState && <Issue issueKey={formState.key} summary={formState.fields.summary} />}
    </Fragment>
  );
};

export const run = render(
  <ProjectPage>
    <App />
  </ProjectPage>
);

const getIssue = async (issueKey) => {
  const issueData = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  const responseData = await issueData.json();
  console.log("getIssue data - " + JSON.stringify(responseData));
  return responseData;
};

const getIssuesDetails = async (projectKey) => {
  const issueData = await api.asUser().requestJira(route`/rest/api/3/search?jql=project=${projectKey}`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  const responseData = await issueData.json();
  return responseData;
};

const getIssues = async (projectKey) => {
  const returnData = [];
  const issueData = await api.asUser().requestJira(route`/rest/api/3/search?jql=project=${projectKey}`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  const responseData = await issueData.json();
  responseData.issues.forEach(element => {
    returnData.push({key: element.key, summary: element.fields.summary});
  });
  console.log("getIssues data - " + JSON.stringify(returnData));
  return returnData;
};

const testHit = async () => {
  const res = await api.fetch('http://api.bounceboard.ai/api/v1/test/komali', {
    method: "GET"
  });
  
  const jsonResponse = await res.json();
  console.log('Response from external API:', jsonResponse);
};
