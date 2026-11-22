import pandas as pd

from fastapi import UploadFile


class ExcelReader:

    @staticmethod
    async def read_excel(file: UploadFile):

        dataframe = pd.read_excel(file.file)

        return dataframe


excel_reader = ExcelReader()