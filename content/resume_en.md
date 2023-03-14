+++
title = "Resume"
date = "2023-01-17T15:45:38+08:00"

+++

## Introduce

#### YuFei Wang

- Career Objective: `RD Engineer`

- Gender: `Male`

- Age: `23`

- Phone: `+86 17610603152`

- Email: `wangyufei.kutu@gmail.com`

------

## Education and work experience

#### Bytedance `2016.9 - Present` `RD-IES Content-Safety, FE`
#### Tencent `2020.7 - 2020.10` `Cloud and Smart Industries Group, FE intern`
#### Google Summer of Code `2019.7 - 2019.10` `OpenWISP, Contributor`
#### Central China Normal University `2017.9 - 2021.7` `Digital Media Technology, Undergraduate`

------

## Professional skills

- Skilled in `Javascript`, learning `Solidity`, `Rust`.

- `5` years of FE learning and project development experience.

- Familiar with FE technology stacks, technical solution design and project development process.

- Familiar with `NodeJS`, have experience in maintaining `BFF` service.

- Familiar with `blockchain`, `contract security`, understand `reverse engineering`, `DeFi`.

- Passionate about open-source and programming, with a wide range of interests including `network security`, `game development`, `computer graphics`.

------

## Project experience

#### Blockchain security `Try digging down various rabbit holes`

- [Written](https://github.com/KuTuGu/Arbitrage) `front-run` bot and `DeFi` attack `POC`

- [Written](https://github.com/KuTuGu/proof-of-innocence) based on the `Tornado` + `ZkVM` proof-of-innocence circuit

- Try decompilation to mine `mev bot` [vulnerability](https://etherscan.io/tx/0x12d867ee837cec251b067319e2802c15b01dc2e18b052b95fcd6657e19ff2a5e)

------

#### ByteDance `Responsible for maintaining all Manual Moderation platforms`

- Build a set of `configuration platform` to support the customized regulation of different audit capabilities of queues of different lines of business.
  1. The capabilities of `extraction`, `submission`, `review` and `visual template` of each business line queue all depend on the scheduling and customized configuration of different capabilities;

  2. For historical reasons, various configurations are hard-coded in the back-end code. By building this set of configuration system at the front end, the back-end manpower is liberated from frequent changes and on-line operation, which also improves the realization efficiency of business requirements for customization.

- The ToB business is mostly in the form scene, and the logic of maintaining the internal state of each component separately is messy, the data flow is not clear
  1. By using `URL` + `state machine`, refactor the form system with `MVC` mode, decoupling the state and logic, and realizing direct and `two-way mapping` from URL to component value;

  2. `Model`: URL is used as the main global state storage; URL Search natively supports `scene snapshots`, which is convenient for scene reproduction and `integration testing`;

  3. `Controller`: As the middle layer, responsible for reading and changing logic, and through `state machine` maintenance, it can visually observe all changing branches, which is convenient for management and monitoring;

  4. `View`: only responsible for rendering related logic and styles, and only communicates with Control;

- Responsible for the integrated construction of all Manual Moderation platforms, and promote the migration of `Monorepo` codebase and the transformation of `micro fe` platforms

------

#### Tencent `Responsible for the requirements of the ToB customer service system`

- Log tool development, using technologies such as `AOP` and `event monitoring`, to realize `black-box` embedding points for performance indicator monitoring
  1. Use the `strategy mode` and `observer mode` to abstract and reconstruct the tool library, make the module `plug-in`, and support custom buried point strategy;

  2. Store log data offline, and use `throttling mode` to periodically report buried points;

  3. BE service uses `SCF + Elastic` to realize complete log stream storage and visualization services;

- Based on Tencent's open source `FeFlow` framework, develop corresponding extension plug-ins for project packaging, deployment, ts, testing, eslint and other functions to ensure the consistency of project structure and specification configuration

- Use `Vue + HighCharts` to build a data visualization panel to visualize the work order data; add log buried points to monitor and analyze the value of the usage of the panel

------

#### Google Summer of Code `Responsible for the construction and optimization of the visualization platform`

- Participate in open source activity and rewrite a visualization tool library for organization, which is used to arrange network device node data and draw network device topology diagrams
  1. Based on `ECharts` + `Leaflet` rendering, use `WebWorker` parallel computing to optimize orchestration performance;

  2. Participated in `Google Code-in` as a Mentor at the end of the year to help college students get in touch with open source projects to improve their programming skills, and work with them to improve the project;

------
