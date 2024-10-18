import React from 'react';

import Sidebar from './Sidebar';

const Main: React.FunctionComponent = (props: React.PropsWithChildren<{}>) => (
  <div className="container 2xl mx-auto flex flex-row">
    <Sidebar />
    <div className="flex-initial basis-1/2">
      {props.children}
    </div>
  </div>
);

export default Main;