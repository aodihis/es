import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  res.json({
    message: "[GET] Hello world!",
  })
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  res.json({
    message: "[POST] Hello world!",
  })
}
