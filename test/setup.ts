import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';

process.env.NODE_ENV = 'test';
use(chaiAsPromised);
use(sinonChai);
