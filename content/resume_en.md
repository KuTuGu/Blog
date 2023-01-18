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

- Email: `zhongliwang48@gmail.com`

------

## Education and work experience

#### Bytedance `2016.9 - Present` `RD-IES Content-Safety, FE`
#### Tencent `2020.7 - 2020.10` `Cloud and Smart Industries Group, FE intern`
#### Google Summer of Code `2019.7 - 2019.10` `OpenWISP, Contributor`
#### Central China Normal University `2017.9 - 2021.7` `Digital Media Technology, Undergraduate`

------

## Professional skills

- Skilled in `Javascript`, learning `Solidity`, `Golang` and `Rust`.

- `5` years of FE learning and project development experience.

- Familiar with FE technology stacks, technical solution design and project development process.

- Familiar with `NodeJS`, have experience in maintaining `BFF` service.

- Familiar with `blockchain`, `contract security`, `reverse engineering`, `DeFi` primitives, and grasp of `symbol analysis`.

- Passionate about open-source and programming, with a wide range of interests including `network security`, `game development`, `computer graphics` and currently exploring `blockchain` rabbit hole.

------

## Project experience

#### Blockchain security `Try digging down various rabbit holes`

- Write `front-run` / `back-run` bot

- Use `Foundry` framework to reproduce the POC of various DeFi attacks

- Use `Mythril` tool, `symbolic analyze` contract vulnerabilities and find `executable paths`

- Try digging `mev bot` exploits

------

#### ByteDance `Responsible for maintaining all Manual Moderation platforms`

- The ToB business is mostly in the form scene, and the logic of maintaining the internal state of each component separately is messy, the data flow is not clear
  1. Refactoring with `MVC` mode, decoupling the state and logic, and realizing direct and `two-way mapping` from URL to component value;

  2. `Model`: URL is used as the main global state storage; URL Search natively supports `scene snapshots`, which is convenient for scene reproduction and `integration testing`;

  3. `Controller`: As the middle layer, responsible for reading and changing logic, and through `state machine` maintenance, it can visually observe all changing branches, which is convenient for management and monitoring;

  4. `View`: only responsible for rendering related logic and styles, and only communicates with Control;

- Historical problems, such as before the business split at home and abroad, there were different conditional branch scenarios in the code, the logic was messy, and it was not easy to maintain
  1. Through the BFF layer integration and delivery of `feature switches`, to better manage the branches, and to roll back in time when an accident occurs, reducing the impact of the accident;

  2. Build a visual management platform for feature switches, responsible for platform-related maintenance

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
  1. Use `WebWorker` parallel computing to optimize orchestration performance;

  2. `ECharts + Leaflet` rendering, stepped on the compatibility of the two frameworks, and also raised some PRs for third-party plug-in;

  3. Participated in `Google Code-in` as a Mentor at the end of the year to help college students get in touch with open source projects to improve their programming skills, and work with them to improve the project;

------
