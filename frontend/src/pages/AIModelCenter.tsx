/**
 * AI Model Training & Prediction Center — 실연동형.
 * VITE_API_BASE 기준 /ml/train/start, train/status, predict, models 호출.
 * Tailwind 동적 클래스 대신 shared/utils/tailwindSafeColors COLOR 매핑 사용.
 */

import React, { useEffect, useMemo, useState } from 'react'
import {
  Play,
  TrendingUp,
  AlertTriangle,
  Activity,
  Zap,
  Target,
  Settings,
  CheckCircle,
  Loader,
  BarChart3,
  Database,
  Upload,
  Wrench,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts'
import axios from 'axios'
import { COLOR, type ColorKey } from '../shared/utils/tailwindSafeColors'

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ||
  'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.detail ?? err.message
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
  }
)

const EP = {
  trainStart: '/ml/train/start',
  trainStatus: '/ml/train/status',
  predict: '/ml/predict',
  modelsList: '/ml/models',
  ingestMat: '/ingest/mat',
  ingestParquet: '/ingest/parquet',
  buildFeatures: '/features/build',
} as const

type ModelKey = 'soh' | 'rul' | 'anomaly' | 'eis'
type DataSource = 'parquet' | 'db' | 'mat'

type ModelConfig = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: ColorKey
  description: string
  features: string[]
  algorithms: string[]
  metrics: string[]
}

export default function AIModelCenter() {
  const [activeTab, setActiveTab] = useState<'train' | 'predict' | 'models'>('train')
  const [selectedModel, setSelectedModel] = useState<ModelKey>('soh')
  const [dataSource, setDataSource] = useState<DataSource>('parquet')
  const [datasetKey, setDatasetKey] = useState('processed')
  const [vehicleId, setVehicleId] = useState<number | ''>('')
  const [pipelineBatteryId, setPipelineBatteryId] = useState('B0005')
  const [pipelineFilePath, setPipelineFilePath] = useState('data/raw/mat/B0005.mat')
  const [isIngesting, setIsIngesting] = useState(false)
  const [isBuildingFeat, setIsBuildingFeat] = useState(false)
  const [trainingJobs, setTrainingJobs] = useState<Record<string, unknown>[]>([])
  const [predictions, setPredictions] = useState<Record<string, unknown> | null>(null)
  const [deployedModels, setDeployedModels] = useState<Record<string, unknown>[]>([])
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>(['B0005', 'B0006'])
  const [isTraining, setIsTraining] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [trainConfig, setTrainConfig] = useState({
    model_type: 'XGBoost',
    test_size: 0.2,
    split_strategy: 'by_battery',
    epochs: 100,
    batch_size: 32,
    learning_rate: 0.001,
  })
  const [predictForm, setPredictForm] = useState({
    battery_id: 'B0005',
    start_cycle: 1,
    end_cycle: 300,
    threshold: 0.35,
  })

  const modelConfigs: Record<ModelKey, ModelConfig> = {
    soh: {
      name: 'State of Health (SoH)',
      icon: Activity,
      color: 'cyan',
      description: 'Predict battery health degradation',
      features: ['capacity', 'voltage', 'temperature', 'cycle_count', 'dQ/dV'],
      algorithms: ['XGBoost', 'LSTM', 'Transformer'],
      metrics: ['RMSE', 'MAE', 'R²'],
    },
    rul: {
      name: 'Remaining Useful Life (RUL)',
      icon: TrendingUp,
      color: 'green',
      description: 'Forecast cycles until end-of-life',
      features: ['capacity_fade', 'resistance_growth', 'voltage_history'],
      algorithms: ['LSTM', 'GRU', 'Conv-LSTM'],
      metrics: ['RMSE', 'MAE', 'Accuracy@20cycles'],
    },
    anomaly: {
      name: 'Anomaly Detection',
      icon: AlertTriangle,
      color: 'yellow',
      description: 'Detect abnormal battery behavior',
      features: ['voltage_deviation', 'temp_spike', 'current_anomaly'],
      algorithms: ['Autoencoder', 'Isolation Forest', 'LSTM-AE'],
      metrics: ['Precision', 'Recall', 'F1-Score'],
    },
    eis: {
      name: 'EIS Analysis',
      icon: Zap,
      color: 'purple',
      description: 'Analyze impedance spectra patterns',
      features: ['Re', 'Rct', 'Warburg', 'Z_real', 'Z_imag'],
      algorithms: ['K-Means', 'DBSCAN', 'Autoencoder'],
      metrics: ['Silhouette', 'Davies-Bouldin', 'Calinski'],
    },
  }

  const config = modelConfigs[selectedModel]
  const C = COLOR[config.color]

  const refreshModelRegistry = async () => {
    try {
      const res = await api.get(EP.modelsList, {
        params: {
          data_source: dataSource,
          dataset_key: datasetKey,
          vehicle_id: vehicleId === '' ? undefined : vehicleId,
          model_task: selectedModel,
        },
      })
      const data = res.data as { models?: Record<string, unknown>[] }
      setDeployedModels(data?.models ?? [])
    } catch {
      setDeployedModels([])
    }
  }

  useEffect(() => {
    if (activeTab === 'models') refreshModelRegistry()
  }, [activeTab, selectedModel, dataSource, datasetKey, vehicleId])

  const runIngest = async () => {
    setIsIngesting(true)
    try {
      const body = { battery_id: pipelineBatteryId, path: pipelineFilePath, source: dataSource }
      if (dataSource === 'mat') {
        await api.post(EP.ingestMat, body)
      } else if (dataSource === 'parquet') {
        await api.post(EP.ingestParquet, body)
      }
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Ingest failed')
    } finally {
      setIsIngesting(false)
    }
  }

  const runBuildFeatures = async () => {
    setIsBuildingFeat(true)
    try {
      await api.post(EP.buildFeatures, {
        battery_ids: selectedBatteries,
        window_tag: 'cycle',
        overwrite: true,
      })
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Build features failed')
    } finally {
      setIsBuildingFeat(false)
    }
  }

  const startTraining = async () => {
    setIsTraining(true)
    try {
      const res = await api.post(EP.trainStart, {
        data_source: dataSource,
        dataset_key: datasetKey,
        vehicle_id: vehicleId === '' ? null : vehicleId,
        model_task: selectedModel,
        model_type: trainConfig.model_type,
        train_config: trainConfig,
        batteries: selectedBatteries,
      })
      const job = res.data as Record<string, unknown>
      setTrainingJobs((prev) => [job, ...prev])
      const jobId = job.job_id as string
      const poll = async () => {
        try {
          const s = await api.get(EP.trainStatus, { params: { job_id: jobId } })
          const sdata = s.data as Record<string, unknown>
          setTrainingJobs((prev) =>
            prev.map((j) => (j.job_id === jobId ? sdata : j))
          )
          if (sdata.status === 'running') setTimeout(poll, 1200)
          else setIsTraining(false)
        } catch {
          setIsTraining(false)
        }
      }
      setTimeout(poll, 900)
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Training failed')
      setIsTraining(false)
    }
  }

  const runPrediction = async () => {
    setIsPredicting(true)
    setPredictions(null)
    try {
      const res = await api.post(EP.predict, {
        data_source: dataSource,
        dataset_key: datasetKey,
        vehicle_id: vehicleId === '' ? null : vehicleId,
        model_task: selectedModel,
        battery_id: predictForm.battery_id,
        start_cycle: predictForm.start_cycle,
        end_cycle: predictForm.end_cycle,
        threshold: predictForm.threshold,
      })
      setPredictions(res.data as Record<string, unknown>)
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Prediction failed')
    } finally {
      setIsPredicting(false)
    }
  }

  const renderPrediction = () => {
    if (!predictions) return null
    if (selectedModel === 'soh') {
      const series = (predictions.series ?? []) as { cycle: number; actual?: number; predicted?: number }[]
      const rows = series.map((r) => ({
        cycle: r.cycle,
        actual: r.actual,
        predicted: r.predicted,
      }))
      return (
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">SoH Prediction Results</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="cycle" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={3} name="Actual SoH" />
              <Line type="monotone" dataKey="predicted" stroke="#a78bfa" strokeWidth={3} strokeDasharray="5 5" name="Predicted SoH" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }
    if (selectedModel === 'rul') {
      const scenarios = (predictions.scenarios ?? []) as { name: string; value: number }[]
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {scenarios.map((s, idx) => (
              <div key={idx} className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-500/30">
                <h4 className="text-sm text-gray-400 mb-2">{s.name}</h4>
                <p className="text-4xl font-bold text-green-400">{s.value}</p>
                <p className="text-xs text-gray-500 mt-2">cycles remaining</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4">RUL Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scenarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }
    if (selectedModel === 'anomaly') {
      const pts = (predictions.scores ?? []) as { cycle: number; score: number; label?: string }[]
      const threshold = (predictions.threshold as number) ?? 0.35
      return (
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Anomaly Detection Results</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="cycle" stroke="#94a3b8" />
              <YAxis dataKey="score" stroke="#94a3b8" domain={[0, 1]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Scatter name="Score" data={pts} fill="#f59e0b" />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-3">
            {pts.map((p, idx) => {
              const label = p.label ?? (p.score >= threshold ? 'Anomaly' : 'Normal')
              const cls =
                label === 'Anomaly'
                  ? 'bg-red-500/10 border-red-500/30'
                  : label === 'Warning'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-green-500/10 border-green-500/30'
              return (
                <div key={idx} className={`p-4 rounded-lg border ${cls}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Cycle {p.cycle}</p>
                      <p className="text-sm text-gray-400">Score: {Number(p.score).toFixed(3)}</p>
                    </div>
                    <span
                      className={
                        label === 'Anomaly'
                          ? 'px-3 py-1 rounded-full text-sm bg-red-500'
                          : label === 'Warning'
                            ? 'px-3 py-1 rounded-full text-sm bg-yellow-500 text-black'
                            : 'px-3 py-1 rounded-full text-sm bg-green-500'
                      }
                    >
                      {label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    if (selectedModel === 'eis') {
      const rows = (predictions.clusters ?? []) as unknown[]
      return (
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">EIS Analysis</h3>
          <div className="text-sm text-gray-300">
            <pre className="whitespace-pre-wrap">{JSON.stringify(rows, null, 2)}</pre>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              AI Model Training & Prediction Center
            </h1>
            <p className="text-gray-400">Data → Feature Store → Train → Predict (Design v2)</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 min-w-[320px]">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-cyan-400" />
              <p className="font-semibold text-sm">Data Context</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['parquet', 'db', 'mat'] as const).map((src) => (
                <button
                  key={src}
                  className={`px-2 py-1.5 rounded-lg text-xs border ${
                    dataSource === src ? 'bg-cyan-500/20 border-cyan-500/40' : 'border-slate-700 hover:border-slate-500'
                  }`}
                  onClick={() => setDataSource(src)}
                >
                  {src === 'parquet' ? 'Parquet' : src === 'db' ? 'DB' : 'MAT'}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">dataset_key</label>
                <input
                  value={datasetKey}
                  onChange={(e) => setDatasetKey(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-700 rounded px-2 py-1 text-xs"
                  placeholder="processed"
                  disabled={dataSource !== 'parquet'}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">vehicle_id</label>
                <input
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900/40 border border-slate-700 rounded px-2 py-1 text-xs"
                  placeholder="1"
                  disabled={dataSource !== 'db'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Pipeline Bar: Ingest → Build Features */}
        <div className="mb-6 bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <div className="grid grid-cols-12 gap-3 items-end flex-wrap">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Pipeline Data Source</label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as DataSource)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="parquet">Parquet</option>
                <option value="mat">MAT</option>
                <option value="db">DB</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Battery</label>
              <select
                value={pipelineBatteryId}
                onChange={(e) => {
                  const bid = e.target.value
                  setPipelineBatteryId(bid)
                  setPipelineFilePath(
                    dataSource === 'parquet'
                      ? `data/raw/parquet/${bid}.parquet`
                      : `data/raw/mat/${bid}.mat`
                  )
                }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                {['B0005', 'B0006', 'B0007', 'B0018'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="col-span-4">
              <label className="text-xs text-gray-400 block mb-1">Server file path</label>
              <input
                value={pipelineFilePath}
                onChange={(e) => setPipelineFilePath(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                placeholder="data/raw/mat/B0005.mat"
              />
            </div>
            <div className="col-span-4 flex gap-2">
              <button
                onClick={runIngest}
                disabled={isIngesting || dataSource === 'db'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-gray-500 text-sm"
              >
                {isIngesting ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Ingest
              </button>
              <button
                onClick={runBuildFeatures}
                disabled={isBuildingFeat}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-gray-500 text-sm"
              >
                {isBuildingFeat ? <Loader className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                Build Features
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">순서: Ingest (MAT/Parquet) → Build Features → Training → Prediction</p>
        </div>

        <div className="flex space-x-2 bg-slate-800/30 p-1 rounded-lg mb-6">
          {(['train', 'predict', 'models'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'train' ? 'Training' : tab === 'predict' ? 'Prediction' : 'Deployed Models'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold mb-3 text-gray-300">Select AI Model</h3>
              <div className="space-y-2">
                {(Object.keys(modelConfigs) as ModelKey[]).map((key) => {
                  const model = modelConfigs[key]
                  const Icon = model.icon
                  const CC = COLOR[model.color]
                  const isSel = selectedModel === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedModel(key)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                        isSel ? CC.selected : 'bg-slate-700/30 border border-transparent hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${CC.icon}`} />
                      <div className="text-left">
                        <p className="text-sm font-semibold">{model.name}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className={`bg-gradient-to-br ${C.card} rounded-xl p-4 border ${C.ring}`}>
              <div className="flex items-center space-x-2 mb-3">
                {React.createElement(config.icon, { className: `w-6 h-6 ${C.icon}` })}
                <h3 className="font-semibold">{config.name}</h3>
              </div>
              <p className="text-sm text-gray-300 mb-3">{config.description}</p>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-gray-400 mb-1">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {config.features.map((feat, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-gray-300">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Algorithms:</p>
                  <div className="flex flex-wrap gap-1">
                    {config.algorithms.map((algo, idx) => (
                      <span key={idx} className={`px-2 py-1 rounded ${C.pill}`}>
                        {algo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-9">
            {activeTab === 'train' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-cyan-400" />
                    <span>Training Configuration</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Model Type</label>
                      <select
                        value={trainConfig.model_type}
                        onChange={(e) => setTrainConfig({ ...trainConfig, model_type: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                      >
                        {config.algorithms.map((algo) => (
                          <option key={algo} value={algo}>{algo}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Test Size</label>
                      <input
                        type="number"
                        value={trainConfig.test_size}
                        onChange={(e) => setTrainConfig({ ...trainConfig, test_size: parseFloat(e.target.value) })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                        step={0.05}
                        min={0.1}
                        max={0.5}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Split Strategy</label>
                      <select
                        value={trainConfig.split_strategy}
                        onChange={(e) => setTrainConfig({ ...trainConfig, split_strategy: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                      >
                        <option value="by_battery">By Battery</option>
                        <option value="by_cycle">By Cycle</option>
                        <option value="random">Random</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Epochs</label>
                      <input
                        type="number"
                        value={trainConfig.epochs}
                        onChange={(e) => setTrainConfig({ ...trainConfig, epochs: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Batch Size</label>
                      <input
                        type="number"
                        value={trainConfig.batch_size}
                        onChange={(e) => setTrainConfig({ ...trainConfig, batch_size: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Learning Rate</label>
                      <input
                        type="number"
                        value={trainConfig.learning_rate}
                        onChange={(e) => setTrainConfig({ ...trainConfig, learning_rate: parseFloat(e.target.value) })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                        step={0.0001}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="text-sm text-gray-400 block mb-2">Training Batteries</label>
                    <div className="flex flex-wrap gap-2">
                      {['B0005', 'B0006', 'B0007', 'B0018'].map((bid) => (
                        <label key={bid} className="flex items-center space-x-2 px-3 py-2 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600">
                          <input
                            type="checkbox"
                            checked={selectedBatteries.includes(bid)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedBatteries([...selectedBatteries, bid])
                              else setSelectedBatteries(selectedBatteries.filter((b) => b !== bid))
                            }}
                          />
                          <span>{bid}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={startTraining}
                    disabled={isTraining || selectedBatteries.length === 0}
                    className="mt-6 w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                  >
                    {isTraining ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Training in Progress...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Training</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">Training Jobs</h3>
                  <div className="space-y-4">
                    {trainingJobs.map((job, idx) => (
                      <div key={(job.job_id as string) ?? idx} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">{String(job.model_key ?? '')}</p>
                            <p className="text-xs text-gray-400">Job ID: {String(job.job_id ?? '')}</p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm flex items-center space-x-2 ${
                              job.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {job.status === 'running' && <Loader className="w-4 h-4 animate-spin" />}
                            {job.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                            <span className="capitalize">{String(job.status ?? '')}</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Number(job.progress ?? 0)}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${Number(job.progress ?? 0)}%` }}
                            />
                          </div>
                        </div>
                        {job.metrics ? (
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {Object.entries(job.metrics as Record<string, unknown>).map(([k, v]) => (
                              <div key={k} className="bg-black/30 rounded p-2 text-center">
                                <p className="text-xs text-gray-400 uppercase">{k}</p>
                                <p className="text-lg font-bold text-green-400">{String(v)}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="bg-black/50 rounded p-3 max-h-24 overflow-y-auto">
                          <div className="space-y-1 font-mono text-xs">
                            {((job.logs as string[]) ?? []).map((log, i) => (
                              <div key={i} className="text-gray-300">{log}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {trainingJobs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No training jobs yet. Start training to see results.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'predict' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    <span>Run Prediction</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Battery ID</label>
                      <select
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                        value={predictForm.battery_id}
                        onChange={(e) => setPredictForm({ ...predictForm, battery_id: e.target.value })}
                      >
                        {['B0005', 'B0006', 'B0007', 'B0018'].map((id) => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Start Cycle</label>
                      <input
                        type="number"
                        value={predictForm.start_cycle}
                        onChange={(e) => setPredictForm({ ...predictForm, start_cycle: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">End Cycle</label>
                      <input
                        type="number"
                        value={predictForm.end_cycle}
                        onChange={(e) => setPredictForm({ ...predictForm, end_cycle: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  {selectedModel === 'anomaly' && (
                    <div className="mb-4">
                      <label className="text-sm text-gray-400 block mb-2">Anomaly Threshold</label>
                      <input
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        value={predictForm.threshold}
                        onChange={(e) => setPredictForm({ ...predictForm, threshold: parseFloat(e.target.value) })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                      />
                    </div>
                  )}
                  <button
                    onClick={runPrediction}
                    disabled={isPredicting}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                  >
                    {isPredicting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Running Prediction...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Run Prediction</span>
                      </>
                    )}
                  </button>
                </div>
                {predictions && renderPrediction()}
                {!predictions && !isPredicting && (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg mb-2">No predictions yet</p>
                    <p className="text-sm">Run a prediction to see AI model results</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'models' && (
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Deployed Models</h3>
                  <button onClick={refreshModelRegistry} className="px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-sm">
                    Refresh
                  </button>
                </div>
                {deployedModels.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg">No deployed models yet</p>
                    <p className="text-sm">Train a model to register it.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deployedModels.map((m, idx) => (
                      <div key={idx} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{String(m.model_key ?? '')}</p>
                            <p className="text-xs text-gray-400">{String(m.model_type ?? '')} · {String(m.model_task ?? '')}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300">ready</span>
                        </div>
                        {m.metrics ? (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {Object.entries(m.metrics as Record<string, unknown>).map(([k, v]) => (
                              <div key={k} className="bg-black/30 rounded p-2 text-center">
                                <p className="text-xs text-gray-400 uppercase">{k}</p>
                                <p className="text-lg font-bold text-cyan-300">{String(v)}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
