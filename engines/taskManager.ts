import { db } from "../src/db";
import { businessTasks, processInstances } from "../src/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AuthorityManager } from "./authorityManager";
import { OrchestrationEngine } from "./orchestrationEngine";
import { ensureProcessTraceabilityTablesExist } from "./processEngine";

export class TaskManager {
  static async getTasks(filters: { status?: string, assignedRole?: string, assignedUserId?: number }) {
    await ensureProcessTraceabilityTablesExist();
    let query = db.select({
      task: businessTasks,
      processInstance: processInstances
    }).from(businessTasks)
    .leftJoin(processInstances, eq(businessTasks.processInstanceId, processInstances.id));
    
    const conditions = [];
    if (filters.status) conditions.push(eq(businessTasks.status, filters.status));
    if (filters.assignedRole) conditions.push(eq(businessTasks.assignedRole, filters.assignedRole));
    if (filters.assignedUserId) conditions.push(eq(businessTasks.assignedUserId, filters.assignedUserId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(businessTasks.createdAt));
  }

  static async assignTask(taskId: number, userId: number) {
    await ensureProcessTraceabilityTablesExist();
    const [task] = await db.select().from(businessTasks).where(eq(businessTasks.id, taskId)).limit(1);
    if (!task) throw new Error("Task not found");
    if (task.status !== "PENDING" && task.status !== "IN_PROGRESS") throw new Error("Task cannot be assigned in current state");
    
    const [updated] = await db.update(businessTasks)
      .set({ assignedUserId: userId, status: "IN_PROGRESS" } as any)
      .where(and(eq(businessTasks.id, taskId), eq(businessTasks.status, task.status)))
      .returning();
      
    if (!updated) throw new Error("Task assignment concurrency conflict");
    return updated;
  }
  
  static async completeTask(taskId: number, userId: string, payload?: any) {
    await ensureProcessTraceabilityTablesExist();
    return await db.transaction(async (tx) => {
      // 1. Get Task
      const [task] = await tx.select().from(businessTasks).where(eq(businessTasks.id, taskId)).limit(1);
      if (!task) throw new Error("Task not found");
      if (task.status === "COMPLETED") return task; // Idempotency
      if (task.status !== "PENDING" && task.status !== "IN_PROGRESS") throw new Error("Task is not completable");
      
      const [instance] = await tx.select().from(processInstances).where(eq(processInstances.id, task.processInstanceId)).limit(1);
      if (!instance) throw new Error("Process instance not found");
      
      // 2. Authorize
      const hasAuthority = await AuthorityManager.validateTransitionAuthority(userId, instance.processDefinitionKey, task.taskCode);
      if (!hasAuthority) throw new Error("Unauthorized to complete this task");

      // 3. Mark completed
      const [completed] = await tx.update(businessTasks)
        .set({ 
          status: "COMPLETED", 
          completedAt: new Date(),
          completedBy: parseInt(userId, 10) || null 
        } as any)
        .where(and(eq(businessTasks.id, taskId), eq(businessTasks.status, task.status)))
        .returning();
        
      if (!completed) throw new Error("Task completion concurrency conflict");

      // 4. Trigger Orchestration Engine to advance process
      await OrchestrationEngine.handleEvent(
        instance.processDefinitionKey,
        instance.businessKey,
        task.taskCode, 
        payload || {},
        tx
      );
      
      return completed;
    });
  }
  
  static async cancelTask(taskId: number, userId: string, reason?: string) {
    await ensureProcessTraceabilityTablesExist();
    return await db.transaction(async (tx) => {
      const [task] = await tx.select().from(businessTasks).where(eq(businessTasks.id, taskId)).limit(1);
      if (!task) throw new Error("Task not found");
      if (task.status === "CANCELLED") return task; // Idempotency
      if (task.status === "COMPLETED") throw new Error("Completed task cannot be cancelled");
      
      const [instance] = await tx.select().from(processInstances).where(eq(processInstances.id, task.processInstanceId)).limit(1);
      if (!instance) throw new Error("Process instance not found");
      
      const hasAuthority = await AuthorityManager.validateTransitionAuthority(userId, instance.processDefinitionKey, task.taskCode);
      if (!hasAuthority) throw new Error("Unauthorized to cancel this task");
      
      const [cancelled] = await tx.update(businessTasks)
        .set({ 
          status: "CANCELLED", 
          errorMessage: reason 
        } as any)
        .where(and(eq(businessTasks.id, taskId), eq(businessTasks.status, task.status)))
        .returning();
        
      if (!cancelled) throw new Error("Task cancellation concurrency conflict");
      return cancelled;
    });
  }
}
