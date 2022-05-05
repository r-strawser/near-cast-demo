import { near, log, json } from "@graphprotocol/graph-ts"
import { FunctionCallLog, TransferCallLog, DeployContractLog, ReceiptBundle, Function } from "../generated/schema"

export function handleReceipt(
  receiptWithOutcome: near.ReceiptWithOutcome
): void {

  const receipt = receiptWithOutcome.receipt;
  const outcome = receiptWithOutcome.outcome;
  const block = receiptWithOutcome.block;

  // acts as break point
  // uncomment if debugging to a specified block
  // if (block.header.height > 70000000) {
  //   return;
  // }
  

  let bundle = ReceiptBundle.load(`${receipt.id.toBase58()}`)
  if(bundle) {
    bundle.receipt_ranTwice = "true"
  }
  if (!bundle) {
    bundle = new ReceiptBundle(`${receipt.id.toBase58()}`)
    bundle.receipt_gasPrice = receipt.gasPrice.length.toString()
    bundle.receipt_predecessorId = receipt.predecessorId.toString()
    bundle.receipt_receiverId = receipt.receiverId.toString()
    bundle.receipt_signerId = receipt.signerId.toString()
    bundle.receipt_signerPublicKey = receipt.signerPublicKey.bytes.toHexString()
    bundle.receipt_ranTwice = "false"

    bundle.outcome_blockHash = outcome.blockHash.toHexString()
    bundle.outcome_executorId = outcome.executorId.toString()
    bundle.outcome_gasBurnt = outcome.gasBurnt.toString()
    bundle.outcome_id = outcome.id.toBase58()
    bundle.outcome_logs = outcome.logs.toString()
    // bundle.outcome_proof = outcome.proof.toString()
    //bundle.outcome_receiptIds = outcome.receiptIds.toString()
    // bundle.outcome_status = outcome
  }







  log.info("****************** Receipt ID {} Start ***********************", [receipt.id.toBase58()]);

  log.info("Receipt data -> id: {}, predecessorId: {}, receiverId: {}, signerId: {}", [
    receipt.id.toBase58(),
    receipt.predecessorId,
    receipt.receiverId,
    receipt.signerId
  ]);
  
  let arrActions = new Array<string>();
  let arrInputDataIds = new Array<string>();
  let arrOutputDataReceivers = new Array<string>();
  let arrOutcomeReceiptIds = new Array<string>();
  const actions = receipt.actions;
  for(let i = 0; i < actions.length; i++) {
    log.info("Receipt actions: kind: {}, data: {}", [actions[i].kind.toString(), actions[i].data.toString()]);
    let act = actions[i].kind.toString().concat(`, ${actions[i].data.toString()}`)
    arrActions.push(act)
  }

  const inputDataIds = receipt.inputDataIds;
  for(let i = 0; i < inputDataIds.length; i++) {
    log.info("Receipt input data id: {}", [inputDataIds[i].toBase58()]);
    arrInputDataIds.push(inputDataIds[i].toBase58())
  }

  const outputDataReceivers = receipt.outputDataReceivers;
  for(let i = 0; i < outputDataReceivers.length; i++) {
    log.info("Receipt output data receiver id: {}", [outputDataReceivers[i].receiverId]);
    arrOutputDataReceivers.push(outputDataReceivers[i].receiverId);
  }

  log.info("Outcome data -> blockHash: {}, id: {}, executorId: {}", [
    outcome.blockHash.toBase58(),
    outcome.id.toBase58(),
    outcome.executorId
  ]);

  const logs = outcome.logs;
  for(let i = 0; i < logs.length; i++) {
    log.info("Outcome logs: {}", [logs[i].toString()]);
  }

  const receiptIds = outcome.receiptIds;
  for(let i = 0; i < receiptIds.length; i++) {
    log.info("Outcome receiptIds: {}", [receiptIds[i].toBase58()]);
    arrOutcomeReceiptIds.push(receiptIds[i].toBase58())
  }

  log.info("****************** Receipt ID {} End ***********************", [receipt.id.toBase58()]);

  bundle.receipt_actions = arrActions;
  bundle.receipt_inputDataIDs = arrInputDataIds;
  bundle.receipt_outputDataReceivers = arrOutputDataReceivers;
  bundle.outcome_receiptIds = arrOutcomeReceiptIds;
  bundle.save()

  for (let i = 0; i < actions.length; i++) {
    handleAction(
      actions[i],
      receipt,
      block,
      outcome
    );
  }
}

function handleAction(
  action: near.ActionValue,
  receipt: near.ActionReceipt,
  block: near.Block,
  outcome: near.ExecutionOutcome
): void {
  // let bundle = ReceiptBundle.load(`${receipt.id.toBase58()}`)
  // if(bundle) {
  //   let arrInputDataIds = new Array<string>();
  //   let arrOutputDataReceivers = new Array<string>();
  //     const inputDataIds = receipt.inputDataIds;
  //   for(let i = 0; i < inputDataIds.length; i++) {
  //     log.info("Receipt input data id: {}", [inputDataIds[i].toBase58()]);
  //     arrInputDataIds.push(inputDataIds[i].toBase58())
  //   }
  //   const outputDataReceivers = receipt.outputDataReceivers;
  //   for(let i = 0; i < outputDataReceivers.length; i++) {
  //     log.info("Receipt output data receiver id: {}", [outputDataReceivers[i].receiverId]);
  //     arrOutputDataReceivers.push(outputDataReceivers[i].receiverId);
  //   }
  //   bundle.receipt_inputDataIDs = arrInputDataIds;
  //   bundle.receipt_outputDataReceivers = arrOutputDataReceivers;
  //   bundle.save();
  // }
  

  if (action.kind == near.ActionKind.CREATE_ACCOUNT) {
    // handler create account
    const newAction = action.toCreateAccount();
    handleCreateAccount(newAction, receipt, block, outcome);
  }

  if (action.kind == near.ActionKind.DEPLOY_CONTRACT) {
    // handler deploy contract
    const newAction = action.toDeployContract();
    handleDeployContract(newAction, receipt, block, outcome);
  }

  if (action.kind == near.ActionKind.TRANSFER) {
    const newAction = action.toTransfer();
    handleTransfer(newAction, receipt, block, outcome);
  }

  if (action.kind == near.ActionKind.FUNCTION_CALL) {
    // handler function call
    const newAction = action.toFunctionCall();
    handleFunctionCall(newAction, receipt, block, outcome);
    
  }
}

function handleCreateAccount(
  createAccount: near.CreateAccountAction,
  receipt: near.ActionReceipt,
  block: near.Block,
  outcome: near.ExecutionOutcome
): void {
  log.info("Receipt create account -> id: {}", [receipt.id.toBase58()]);
}

function handleDeployContract(
  deployContract: near.DeployContractAction,
  receipt: near.ActionReceipt,
  block: near.Block,
  outcome: near.ExecutionOutcome
): void {
  log.info("Receipt deploy contract -> id: {}", [receipt.id.toBase58()]);
  let depContract = new DeployContractLog(`${receipt.id.toBase58()}`);
  depContract.codeHash = deployContract.codeHash.toBase58()
  depContract.blockHash = block.header.hash.toHexString();
  depContract.outcomeLogs = outcome.logs.toString();
  depContract.save();
}

function handleTransfer(
  transfer: near.TransferAction,
  receipt: near.ActionReceipt,
  block: near.Block,
  outcome: near.ExecutionOutcome
): void {
  log.info("Receipt transfer -> id: {}, deposit: {}, hash: {}, outcome logs: {}", [
    receipt.id.toBase58(),
    transfer.deposit.toHexString(),
    block.header.hash.toHexString(),
    outcome.logs.toString()
  ]);
  let transferCall = new TransferCallLog(`${receipt.id.toBase58()}`);
  if(transferCall.deposit) {
    transferCall.deposit = transfer.deposit.toHexString();
  }
  transferCall.blockHash = block.header.hash.toHexString();
  transferCall.outcomeLogs = outcome.logs.toString();
  transferCall.save();
}

function handleFunctionCall(
  functionCall: near.FunctionCallAction,
  receipt: near.ActionReceipt,
  block: near.Block,
  outcome: near.ExecutionOutcome
): void {
  log.info("Receipt function call -> id: {}, method: {}, args: {}, deposit: {}, hash: {}, outcome logs: {}", [
    receipt.id.toBase58(),
    functionCall.methodName,
    functionCall.args.toString(),
    functionCall.deposit.toHexString(),
    block.header.hash.toHexString(),
    outcome.logs.toString()
  ]);

  let newFunction = Function.load(`${functionCall.methodName}`)
  // let arrMethodNames = new Array<string>();
  if(!newFunction) {
    newFunction = new Function(`${functionCall.methodName}`)
    newFunction.example_args = functionCall.args.toString()
    newFunction.example_outcomeLogs = outcome.logs.toString()
    // arrMethodNames.push(`${functionCall.methodName.concat(`,${outcome.logs.toString()}`)}`)
    newFunction.save();
  }

  let funcCall = new FunctionCallLog(`${receipt.id.toBase58()}`);
  funcCall.methodName = functionCall.methodName;
  funcCall.args = functionCall.args.toString();
  funcCall.deposit = functionCall.deposit.toHexString();
  funcCall.blockHash = block.header.hash.toHexString();
  funcCall.outcomeLogs = outcome.logs.toString();
  funcCall.signerId = receipt.signerId.toString();
  funcCall.predecessordId = receipt.predecessorId.toString();
  funcCall.receiverId = receipt.receiverId.toString();
  funcCall.blockHeight = block.header.height.toString();
  funcCall.blockTimestamp = block.header.timestampNanosec.toString()

  if(funcCall.outcomeLogs != null){
    // "EVENT_JSON:" is an indication that an NEP standard event is being emitted
    if(outcome.logs[0].startsWith("EVENT_JSON:")){
      log.info('ENTERED - unparsed outcome.logs[0] -> {}', [outcome.logs[0]])
      let parsed = outcome.logs[0].replace('EVENT_JSON:', '')

      let jsonData = json.try_fromString(parsed)
      if(jsonData.value != null) {
        const jsonObject = jsonData.value.toObject()
        let eventStandard = jsonObject.get('standard')
        if(eventStandard) {
          funcCall.eventStandard = eventStandard.toString()
        }
        let eventName = jsonObject.get('event')
        if(eventName) {
          funcCall.eventName = eventName.toString()
        }
      }
    }
  }

  funcCall.save();
}